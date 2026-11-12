import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { AuthService } from '../../modules/auth/services/auth.service';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? '');

    if (!match) {
      throw new UnauthorizedException('Bearer token is required');
    }

    request.user = await this.authService.authenticate(match[1]);

    return true;
  }
}
