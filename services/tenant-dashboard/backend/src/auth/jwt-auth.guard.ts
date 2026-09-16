import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Explicit no-arg constructor: see the matching note in the Super Admin
// backend's jwt-auth.guard.ts — without it, Nest can misread Passport's own
// optional constructor param metadata as a required dependency of this class.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
