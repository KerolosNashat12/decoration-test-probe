import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { AdminUsersService } from './admin-users.service.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

// Managing OTHER admin users is Super Admin-only — a Reviewer can review
// tenant applications but can't create or deactivate admin accounts.
// The `me` routes below are the exception: any signed-in admin (either
// role) can view/edit their own profile and change their own password,
// so they carry a method-level @Roles() override of the class-level
// SUPER_ADMIN restriction. They're declared ahead of the `:id` route so
// "me" is never captured as a param value.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('me')
  @Roles('SUPER_ADMIN', 'REVIEWER')
  getMe(@Req() req: Request & { user: JwtPayload }) {
    return this.adminUsersService.findMe(req.user.sub);
  }

  @Patch('me')
  @Roles('SUPER_ADMIN', 'REVIEWER')
  updateMe(@Body() dto: UpdateOwnProfileDto, @Req() req: Request & { user: JwtPayload }) {
    return this.adminUsersService.updateMe(req.user.sub, dto);
  }

  @Patch('me/password')
  @Roles('SUPER_ADMIN', 'REVIEWER')
  changeMyPassword(@Body() dto: ChangePasswordDto, @Req() req: Request & { user: JwtPayload }) {
    return this.adminUsersService.changeMyPassword(req.user.sub, dto);
  }

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
