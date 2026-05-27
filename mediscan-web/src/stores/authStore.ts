'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import { decodeToken, isTokenExpired } from '@/lib/auth';
import type { UserRole } from '@/types/api';

interface AuthUser {
  userId: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  /** Call after successful login — stores token in cookie + state */
  login: (token: string) => void;

  /** Clears everything */
  logout: () => void;

  /** Read existing cookie on app mount */
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token: string) => {
    const decoded = decodeToken(token);
    if (!decoded) return;

    // Store in cookie with security flags
    Cookies.set('mediscan_token', token, {
      secure: true,
      sameSite: 'strict',
      expires: 7, // 7 days max — actual expiry controlled by JWT exp claim
    });

    set({
      token,
      user: { userId: decoded.userId, role: decoded.role },
      isAuthenticated: true,
    });
  },

  logout: () => {
    Cookies.remove('mediscan_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = Cookies.get('mediscan_token');
    if (!token || isTokenExpired(token)) {
      Cookies.remove('mediscan_token');
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      Cookies.remove('mediscan_token');
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }

    set({
      token,
      user: { userId: decoded.userId, role: decoded.role },
      isAuthenticated: true,
    });
  },
}));
