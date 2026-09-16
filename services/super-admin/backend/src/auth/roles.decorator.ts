import { SetMetadata } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: JwtPayload['role'][]) => SetMetadata(ROLES_KEY, roles);
