import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InternalSecretGuard } from './internal-secret.guard.js';
import { ProvisioningService } from './provisioning.service.js';
import { ProvisionTenantDto } from './dto/provision-tenant.dto.js';
import { SetAccountActiveDto } from './dto/set-account-active.dto.js';

// Internal, service-to-service only — see internal-secret.guard.ts. Super
// Admin's backend is the only intended caller: right after it approves a
// tenant application (or when an admin retries provisioning for a tenant
// that doesn't have dashboard access yet), and whenever it suspends or
// reactivates a tenant (keeps this service's login in sync — see
// ProvisioningService.setAccountActive).
@UseGuards(InternalSecretGuard)
@Controller('internal')
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Post('provision-tenant')
  @HttpCode(HttpStatus.CREATED)
  provision(@Body() dto: ProvisionTenantDto) {
    return this.provisioningService.provision(dto);
  }

  @Patch('tenant-accounts/:tenantId/active')
  setActive(@Param('tenantId') tenantId: string, @Body() dto: SetAccountActiveDto) {
    return this.provisioningService.setAccountActive(tenantId, dto.isActive);
  }
}
