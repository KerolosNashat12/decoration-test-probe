import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TenantJwtPayload } from '../auth/jwt.strategy.js';
import { RfqsService } from './rfqs.service.js';
import { RespondRfqDto } from './dto/respond-rfq.dto.js';
import { DeclineRfqDto } from './dto/decline-rfq.dto.js';
import { ListRfqsQueryDto } from './dto/list-rfqs-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('rfqs')
export class RfqsController {
  constructor(private readonly rfqsService: RfqsService) {}

  @Get()
  findAll(@Query() query: ListRfqsQueryDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.rfqsService.findAll(req.user.dbName, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.rfqsService.findOne(req.user.dbName, id);
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @Body() dto: RespondRfqDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.rfqsService.respond(req.user.dbName, id, dto);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string, @Body() dto: DeclineRfqDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.rfqsService.decline(req.user.dbName, id, dto);
  }
}
