import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/control/index.js';

// The control database's Prisma client — one physical database for the
// whole service, holding TenantAccount only (see prisma/control/schema.prisma).
// Never used to reach a tenant's own data; that's TenantPrismaFactory's job.
@Injectable()
export class PrismaControlService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaControlService.name);

  constructor() {
    super({ datasourceUrl: process.env.CONTROL_DATABASE_URL });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the control database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
