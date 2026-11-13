import { createClient } from '../supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function clinicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('API URL is not configured');
  }

  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new ApiError('Authentication session expired', 401);
  }

  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${session.access_token}`);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    let message = 'Unable to complete the request';
    if (typeof result?.message === 'string') {
      message = result.message;
    }

    throw new ApiError(message, response.status);
  }

  return result as T;
}
