import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

// Guards the internal provisioning API: this is service-to-service traffic
// (Super Admin's backend calling this backend directly, never a browser),
// so it's authenticated with a shared secret header instead of a tenant or
// admin JWT — there is no user session on either side of this call.
@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-internal-secret'];
    const expected = process.env.TENANT_DASHBOARD_INTERNAL_SECRET;

    if (!expected) {
      // Fail closed: an unset secret must never be treated as "no auth
      // required" — that would leave the provisioning endpoint wide open.
      throw new UnauthorizedException('Internal secret is not configured on this service');
    }
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid or missing internal secret');
    }
    return true;
  }
}
