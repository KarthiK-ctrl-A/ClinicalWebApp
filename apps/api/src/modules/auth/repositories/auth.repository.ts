import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findProfileById(userId: string, accessToken: string) {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new ServiceUnavailableException('Unable to retrieve user profile');
    }

    return data;
  }
}
