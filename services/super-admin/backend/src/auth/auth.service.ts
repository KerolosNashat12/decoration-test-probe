import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('This admin account has been deactivated');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: admin.id, email: admin.email, role: admin.role };

    return {
      accessToken: await this.jwt.signAsync(payload),
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  }
}
