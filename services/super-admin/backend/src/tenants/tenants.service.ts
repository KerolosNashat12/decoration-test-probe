import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // Super Admin adding a tenant directly (not via a public application).
  create(dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: { ...dto, status: 'APPROVED', reviewedAt: new Date() },
    });
  }

  findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    return this.prisma.tenant.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async suspend(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { status: 'SUSPENDED' } });
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { status: 'APPROVED' } });
  }
}
