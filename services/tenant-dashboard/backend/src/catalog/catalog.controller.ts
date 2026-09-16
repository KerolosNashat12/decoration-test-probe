import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TenantJwtPayload } from '../auth/jwt.strategy.js';
import { CatalogService } from './catalog.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll(@Query() query: ListProductsQueryDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.catalogService.findAll(req.user.dbName, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.catalogService.findOne(req.user.dbName, id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.catalogService.create(req.user.dbName, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.catalogService.update(req.user.dbName, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user: TenantJwtPayload }) {
    return this.catalogService.remove(req.user.dbName, id);
  }
}
