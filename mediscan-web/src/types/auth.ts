import type { DecodedToken, UserRole } from './api';

export type { DecodedToken, UserRole };

export interface AuthState {
  token: string | null;
  user: {
    userId: string;
    role: UserRole;
  } | null;
  isAuthenticated: boolean;
}
