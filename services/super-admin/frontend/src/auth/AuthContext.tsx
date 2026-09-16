import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { AdminUser, LoginResponse } from '../types';

interface AuthContextValue {
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdmin: (patch: Partial<AdminUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'decoration_admin_token';
const USER_KEY = 'decoration_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      async login(email: string, password: string) {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.admin));
        setAdmin(data.admin);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAdmin(null);
      },
      updateAdmin(patch: Partial<AdminUser>) {
        setAdmin((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          localStorage.setItem(USER_KEY, JSON.stringify(next));
          return next;
        });
      },
    }),
    [admin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
