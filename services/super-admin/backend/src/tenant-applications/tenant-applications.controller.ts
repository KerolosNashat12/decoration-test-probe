import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { TenantApplicationsService } from './tenant-applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { RejectApplicationDto } from './dto/reject-application.dto.js';

@Controller('tenant-applications')
export class TenantApplicationsController {
  constructor(private readonly applicationsService: TenantApplicationsService) {}

  // PUBLIC — the public website's "request to join" form posts here.
  // No auth guard: this is intentionally open, it just lands in Super
  // Admin's review queue as PENDING.
  @Post()
  submit(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.submit(dto);
  }

  // Everything below is Super Admin's review queue — protected.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.applicationsService.findAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'REVIEWER')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Req() req: Request & { user: JwtPayload }) {
    return this.applicationsService.approve(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'REVIEWER')
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.applicationsService.reject(id, req.user.sub, dto.reason);
  }
}
