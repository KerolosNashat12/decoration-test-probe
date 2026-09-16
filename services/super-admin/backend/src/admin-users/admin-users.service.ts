import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';

const SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.adminUser.findMany({
      select: SAFE_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An admin with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.adminUser.create({
      data: { name: dto.name, email: dto.email, role: dto.role, passwordHash },
      select: SAFE_FIELDS,
    });
  }

  async update(id: string, dto: UpdateAdminUserDto, actingAdminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);

    if (id === actingAdminId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    return this.prisma.adminUser.update({
      where: { id },
      data: dto,
      select: SAFE_FIELDS,
    });
  }
}
