import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../../generated/tenant/index.js';
import { buildTenantDatabaseUrl } from './tenant-db.util.js';

// One PrismaClient per tenant database, built on demand and cached for the
// life of this process (a warm connection per active tenant, not a fresh
// connection per request). There is deliberately no single client that can
// see every tenant's data — this factory is the only thing in the service
// that can open a connection to a specific tenant's database, and it only
// ever does so for the one dbName it's asked for.
//
// Scaffold-level cache: unbounded, no idle eviction. Fine for a handful of
// tenants in dev; worth capping (LRU with $disconnect on evict) before this
// carries real tenant traffic.
@Injectable()
export class TenantPrismaFactory implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaFactory.name);
  private readonly clients = new Map<string, TenantPrismaClient>();

  forDatabase(dbName: string): TenantPrismaClient {
    let client = this.clients.get(dbName);
    if (!client) {
      client = new TenantPrismaClient({ datasourceUrl: buildTenantDatabaseUrl(dbName) });
      this.clients.set(dbName, client);
      this.logger.debug(`Opened a Prisma client for tenant database "${dbName}"`);
    }
    return client;
  }

  async onModuleDestroy() {
    await Promise.all([...this.clients.values()].map((client) => client.$disconnect()));
  }
}
