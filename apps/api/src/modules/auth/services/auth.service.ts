import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import {
  AuthenticatedUser,
  UserRole,
} from '../../../common/interfaces/authenticated-user.interface';

import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly authRepository: AuthRepository,
  ) {}

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase.verifyToken(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    const profile = await this.authRepository.findProfileById(
      data.user.id,
      accessToken,
    );

    if (!profile) {
      throw new ForbiddenException('User profile is not configured');
    }

    if (profile.role !== 'doctor' && profile.role !== 'patient') {
      throw new ForbiddenException('Invalid user role');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      fullName: profile.full_name,
      role: profile.role as UserRole,
      accessToken,
    };
  }
}
