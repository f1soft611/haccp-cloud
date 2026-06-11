import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../shared/store/authStore';

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: UserRole[];
}>;

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const onboardingRequired = useAuthStore((state) => state.onboardingRequired);
  const onboardingStatus = useAuthStore((state) => state.onboardingStatus);
  const isTenantFirstSetupRoute = location.pathname === '/tenant-first-setup';
  const effectiveOnboardingRequired =
    onboardingRequired || onboardingStatus !== 'COMPLETED';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    role === 'TENANT_ADMIN' &&
    effectiveOnboardingRequired &&
    !isTenantFirstSetupRoute
  ) {
    return <Navigate to="/tenant-first-setup" replace />;
  }

  if (
    role === 'TENANT_ADMIN' &&
    !effectiveOnboardingRequired &&
    isTenantFirstSetupRoute
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
