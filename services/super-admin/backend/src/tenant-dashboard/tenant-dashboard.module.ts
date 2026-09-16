import { Global, Module } from '@nestjs/common';
import { TenantDashboardClientService } from './tenant-dashboard-client.service.js';

@Global()
@Module({
  providers: [TenantDashboardClientService],
  exports: [TenantDashboardClientService],
})
export class TenantDashboardModule {}
