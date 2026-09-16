import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();
  if (!tenant) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
