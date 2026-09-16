import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// An explicit no-arg constructor is required here: without one, TypeScript
// emits no design:paramtypes for this class, and @nestjs/passport's
// AuthGuard mixin's own (optional) AuthModuleOptions constructor param
// metadata gets inherited through the prototype chain instead — which
// Nest then reports as an unresolvable required dependency.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
