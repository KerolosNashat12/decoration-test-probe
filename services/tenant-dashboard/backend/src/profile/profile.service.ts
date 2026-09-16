import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly tenantPrisma: TenantPrismaFactory) {}

  async findOne(dbName: string, tenantId: string) {
    const profile = await this.tenantPrisma.forDatabase(dbName).profile.findUnique({ where: { tenantId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(dbName: string, tenantId: string, dto: UpdateProfileDto) {
    await this.findOne(dbName, tenantId);
    return this.tenantPrisma.forDatabase(dbName).profile.update({ where: { tenantId }, data: dto });
  }
}
