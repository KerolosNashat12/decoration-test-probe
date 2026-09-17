import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaControlService } from '../prisma-control/prisma-control.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

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

  // SRS §15. Session stays valid after a change (no forced re-login) —
  // the JWT already issued keeps working until it naturally expires.
  async changeMyPassword(accountId: string, dto: ChangePasswordDto) {
    const account = await this.control.tenantAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const currentMatches = await bcrypt.compare(dto.currentPassword, account.passwordHash);
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.control.tenantAccount.update({ where: { id: accountId }, data: { passwordHash } });
    return { success: true };
  }
}
