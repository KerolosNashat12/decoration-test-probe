import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-env',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  // PassportModule + JwtModule are re-exported so any module importing
  // AuthModule can use JwtAuthGuard (AuthGuard('jwt')) without redeclaring
  // its own Passport/JWT wiring.
  exports: [PassportModule, JwtModule, RolesGuard],
})
export class AuthModule {}
