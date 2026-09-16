import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaControlService } from '../prisma-control/prisma-control.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly control: PrismaControlService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const account = await this.control.tenantAccount.findUnique({ where: { email } });
    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, account.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!account.isActive) {
      throw new UnauthorizedException('This tenant account has been deactivated');
    }

    await this.control.tenantAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: account.id, email: account.email, dbName: account.dbName };

    return {
      accessToken: await this.jwt.signAsync(payload),
      tenant: { id: account.id, name: account.name, email: account.email },
    };
  }
}
