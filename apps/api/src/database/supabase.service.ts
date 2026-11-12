import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly authClient: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.authClient = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  async verifyToken(accessToken: string) {
    return this.authClient.auth.getUser(accessToken);
  }

  forUser(accessToken: string): SupabaseClient {
    return createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      {
        accessToken: async () => accessToken,
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
}
