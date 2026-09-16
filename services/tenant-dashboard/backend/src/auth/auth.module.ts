import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-env',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // PassportModule + JwtModule re-exported so any module importing
  // AuthModule can use JwtAuthGuard (AuthGuard('jwt')) without redeclaring
  // its own Passport/JWT wiring — same pattern as the Super Admin backend.
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
