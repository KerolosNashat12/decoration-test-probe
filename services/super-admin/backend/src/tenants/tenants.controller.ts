import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { TenantsService } from './tenants.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

// Everything here is Super Admin-only — this is the tenant registry, not a
// tenant-facing endpoint. A tenant's own dashboard lives in a separate
// service with its own auth once that's built.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    return this.tenantsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.tenantsService.reactivate(id);
  }
}
