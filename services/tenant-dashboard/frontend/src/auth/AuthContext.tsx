import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { LoginResponse, TenantSession } from '../types';

interface AuthContextValue {
  tenant: TenantSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'decoration_tenant_token';
const SESSION_KEY = 'decoration_tenant_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantSession | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as TenantSession) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      tenant,
      async login(email: string, password: string) {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.tenant));
        setTenant(data.tenant);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        setTenant(null);
      },
    }),
    [tenant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
