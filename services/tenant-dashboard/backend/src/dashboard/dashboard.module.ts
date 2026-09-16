import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { RfqsModule } from '../rfqs/rfqs.module.js';

@Module({
  imports: [AuthModule, RfqsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
