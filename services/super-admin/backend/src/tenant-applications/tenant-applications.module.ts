import { Module } from '@nestjs/common';
import { TenantApplicationsController } from './tenant-applications.controller.js';
import { TenantApplicationsService } from './tenant-applications.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TenantApplicationsController],
  providers: [TenantApplicationsService],
})
export class TenantApplicationsModule {}
