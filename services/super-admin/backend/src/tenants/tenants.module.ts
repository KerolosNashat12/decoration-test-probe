import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
