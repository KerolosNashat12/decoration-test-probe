import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface TenantJwtPayload {
  sub: string; // TenantAccount.id (== Super Admin Tenant.id)
  email: string;
  dbName: string; // which physical database this tenant's data lives in
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-env',
    });
  }

  validate(payload: TenantJwtPayload): TenantJwtPayload {
    return payload;
  }
}
