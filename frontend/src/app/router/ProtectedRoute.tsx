import type { PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../shared/store/authStore';
import { listAccessibleMenuPaths } from '../../services/platform-admin/platformUserMenuService';
import { resolveLoginPathWithLastDomain } from '../../shared/utils/loginDomainRouting';

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: UserRole[];
  enforceMenuAccess?: boolean;
}>;

export function ProtectedRoute({
  children,
  allowedRoles,
  enforceMenuAccess = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const onboardingRequired = useAuthStore((state) => state.onboardingRequired);
  const onboardingStatus = useAuthStore((state) => state.onboardingStatus);
  const isTenantFirstSetupRoute = location.pathname === '/tenant-first-setup';
  const effectiveOnboardingRequired =
    onboardingRequired || onboardingStatus !== 'COMPLETED';
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';

  const accessibleMenuQuery = useQuery({
    queryKey: ['protected-route-accessible-menus'],
    queryFn: listAccessibleMenuPaths,
    enabled: isAuthenticated && enforceMenuAccess,
    retry: false,
  });

  if (!isAuthenticated) {
    return <Navigate to={resolveLoginPathWithLastDomain()} replace />;
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

  if (enforceMenuAccess) {
    if (accessibleMenuQuery.isPending) {
      return null;
    }

    const accessiblePaths = accessibleMenuQuery.data ?? [];
    const hasMenuAccess =
      normalizedPath === '/dashboard' ||
      accessiblePaths.some(
        (path) =>
          normalizedPath === path || normalizedPath.startsWith(`${path}/`),
      );

    if (!hasMenuAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
