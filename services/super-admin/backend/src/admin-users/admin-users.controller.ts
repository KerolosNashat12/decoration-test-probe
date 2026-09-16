import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { AdminUsersService } from './admin-users.service.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';

// Managing OTHER admin users is Super Admin-only — a Reviewer can review
// tenant applications but can't create or deactivate admin accounts.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.adminUsersService.update(id, dto, req.user.sub);
  }
}
