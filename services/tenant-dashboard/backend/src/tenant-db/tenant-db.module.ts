import { Global, Module } from '@nestjs/common';
import { TenantPrismaFactory } from './tenant-prisma.factory.js';

@Global()
@Module({
  providers: [TenantPrismaFactory],
  exports: [TenantPrismaFactory],
})
export class TenantDbModule {}
