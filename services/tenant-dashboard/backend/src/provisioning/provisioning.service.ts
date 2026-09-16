import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaControlService } from '../prisma-control/prisma-control.service.js';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { buildTenantDatabaseUrl, tenantDbNameFor } from '../tenant-db/tenant-db.util.js';
import { createTenantDatabase } from './db-admin.util.js';
import { ProvisionTenantDto } from './dto/provision-tenant.dto.js';
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
    this.runTenantMigrations(dbName);

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

  // Shells out to the Prisma CLI rather than a programmatic migration API —
  // see the "Caveat" paragraph in ARCHITECTURE.md's provisioning section:
  // this assumes a long-running Node process with a writable filesystem and
  // shell access, which a Vercel serverless function is not.
  private runTenantMigrations(dbName: string) {
    execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/tenant/schema.prisma'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: buildTenantDatabaseUrl(dbName) },
      stdio: 'pipe',
    });
  }
}
