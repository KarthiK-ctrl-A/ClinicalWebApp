import type { Request } from 'express';

export type UserRole = 'doctor' | 'patient';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  accessToken: string;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};