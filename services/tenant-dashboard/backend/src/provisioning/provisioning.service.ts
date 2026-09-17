import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';
import { PrismaControlService } from '../prisma-control/prisma-control.service.js';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { buildTenantDatabaseUrl, tenantDbNameFor } from '../tenant-db/tenant-db.util.js';
import { createTenantDatabase } from './db-admin.util.js';
import { ProvisionTenantDto } from './dto/provision-tenant.dto.js';
import { TENANT_MIGRATIONS } from './tenant-migrations.sql.js';
import type { TenantCategory } from '../../generated/tenant/index.js';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly control: PrismaControlService,
    private readonly tenantPrisma: TenantPrismaFactory,
  ) {}

  // Steps are ordered so a retry after a partial failure is safe: every
  // step before the last is idempotent (create-database and migrate-deploy
  // are no-ops if already done; the profile seed is an upsert), and the
  // control-database row is written LAST, since that row is exactly what
  // the idempotency check at the top keys off — so "did this already
  // fully succeed" and "is it safe to redo the earlier steps" agree.
  async provision(dto: ProvisionTenantDto) {
    const existing = await this.control.tenantAccount.findUnique({ where: { id: dto.tenantId } });
    if (existing) {
      throw new ConflictException(`Tenant ${dto.tenantId} is already provisioned`);
    }

    const dbName = tenantDbNameFor(dto.tenantId);
    this.logger.log(`Provisioning tenant ${dto.tenantId} -> database "${dbName}"`);

    await createTenantDatabase(dbName);
    await this.runTenantMigrations(dbName);

    const tenantClient = this.tenantPrisma.forDatabase(dbName);
    await tenantClient.profile.upsert({
      where: { tenantId: dto.tenantId },
      create: {
        tenantId: dto.tenantId,
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        district: dto.district,
        categories: dto.categories as TenantCategory[],
      },
      update: {}, // a retry never clobbers changes the tenant may have already made
    });

    const temporaryPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.control.tenantAccount.create({
      data: {
        id: dto.tenantId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        dbName,
      },
    });

    this.logger.log(`Provisioned tenant ${dto.tenantId}: login ${dto.email}, database "${dbName}"`);

    return { email: dto.email, temporaryPassword, dbName };
  }

  // Keeps this service's login in sync with Super Admin's tenant registry:
  // called when a tenant is suspended/reactivated there, so a suspended
  // tenant is actually locked out here too (AuthService.login checks this
  // same TenantAccount.isActive flag) rather than the two services'
  // records silently drifting apart.
  async setAccountActive(tenantId: string, isActive: boolean) {
    const account = await this.control.tenantAccount.findUnique({ where: { id: tenantId } });
    if (!account) throw new NotFoundException(`Tenant ${tenantId} is not provisioned`);
    await this.control.tenantAccount.update({ where: { id: tenantId }, data: { isActive } });
    return { success: true };
  }

  // Applies the tenant-schema migrations by running their SQL directly over
  // a plain `pg` connection, rather than shelling out to the Prisma CLI
  // (`npx prisma migrate deploy`). The old shell-out approach — see
  // ARCHITECTURE.md's "Caveat" paragraph on this flow, which called it out
  // as a likely problem before this was ever deployed — failed on every
  // real attempt on Vercel with `ENOENT ... mkdir '/home/sbx_user1051'`:
  // a serverless function's filesystem is read-only, so npx has nowhere to
  // write its cache/home directory, let alone download or run the Prisma
  // CLI. Running the migration SQL ourselves needs nothing but an open
  // Postgres connection, which is the one thing a serverless function can
  // always do within its execution limit.
  //
  // Mirrors what `prisma migrate deploy` itself does: apply each pending
  // migration's SQL in order inside a transaction, then record it in
  // `_prisma_migrations` (same columns Prisma uses, with a matching sha256
  // checksum of the migration.sql content) so the database's migration
  // history stays in a shape Prisma tooling recognizes, should anyone run
  // `prisma migrate status`/`deploy` against a tenant database by hand
  // later (e.g. from a dev machine).
  private async runTenantMigrations(dbName: string) {
    const client = new Client({ connectionString: buildTenantDatabaseUrl(dbName) });
    await client.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
            "id" VARCHAR(36) NOT NULL PRIMARY KEY,
            "checksum" VARCHAR(64) NOT NULL,
            "finished_at" TIMESTAMPTZ,
            "migration_name" VARCHAR(255) NOT NULL,
            "logs" TEXT,
            "rolled_back_at" TIMESTAMPTZ,
            "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
            "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);

      for (const migration of TENANT_MIGRATIONS) {
        const { rows } = await client.query('SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $1', [
          migration.name,
        ]);
        if (rows.length > 0) {
          continue; // already applied — e.g. a retry after a later step failed
        }

        const checksum = crypto.createHash('sha256').update(migration.sql).digest('hex');
        try {
          await client.query('BEGIN');
          await client.query(migration.sql);
          await client.query(
            `INSERT INTO "_prisma_migrations"
               ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
             VALUES ($1, $2, now(), $3, now(), 1)`,
            [crypto.randomUUID(), checksum, migration.name],
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    } finally {
      await client.end();
    }
  }
}
