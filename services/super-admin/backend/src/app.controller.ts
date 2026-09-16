import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Small, non-sensitive runtime config the admin frontend needs but
  // shouldn't hardcode (e.g. the Tenant Dashboard's login URL, shown next
  // to each tenant's dashboard access so an admin doesn't have to dig it
  // out of the credentials email). Guarded like everything else here —
  // this app has no public-facing pages besides tenant applications.
  @UseGuards(JwtAuthGuard)
  @Get('config')
  getConfig() {
    return {
      tenantDashboardUrl: process.env.TENANT_DASHBOARD_FRONTEND_URL ?? null,
    };
  }
}
