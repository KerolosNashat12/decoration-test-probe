import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TenantJwtPayload } from '../auth/jwt.strategy.js';
import { ProfileService } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findOne(@Req() req: Request & { user: TenantJwtPayload }) {
    return this.profileService.findOne(req.user.dbName, req.user.sub);
  }

  @Patch()
  update(@Body() dto: UpdateProfileDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.profileService.update(req.user.dbName, req.user.sub, dto);
  }
}
