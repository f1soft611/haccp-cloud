import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { LoginPage } from '../../pages/auth/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../../pages/DashboardPage';
import { OnboardingPage } from '../../pages/tenant-management/onboarding/OnboardingPage';
import { UsersPage } from '../../pages/tenant-management/users/UsersPage';
import { DepartmentsPage } from '../../pages/tenant-management/departments/DepartmentsPage';
import { DocumentsPage } from '../../pages/tenant-management/documents/DocumentsPage';
import { DocumentHistoryPage } from '../../pages/tenant-management/documents/DocumentHistoryPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { TenantFirstLoginSetupPage } from '../../pages/tenant-management/onboarding/TenantFirstLoginSetupPage';
import { PlatformAdminLoginPage } from '../../pages/auth/PlatformAdminLoginPage';
import { LoginHistoryPage } from '../../pages/admin/LoginHistoryPage';
import { PlatformMenuManagementPage } from '../../pages/platform-admin/menus/PlatformMenuManagementPage';
import { PlatformAuthorityManagementPage } from '../../pages/platform-admin/authorities/PlatformAuthorityManagementPage';
import { AccountPasswordPage } from '../../pages/account/AccountPasswordPage';
import { useAuthStore } from '../../shared/store/authStore';

function DefaultHomeRoute() {
  const role = useAuthStore((state) => state.role);
  const defaultPath = role === 'PLATFORM_ADMIN' ? '/platform' : '/dashboard';

  return <Navigate to={defaultPath} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/platform" element={<PlatformAdminLoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DefaultHomeRoute />} />
        <Route path="/platform" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/platform/onboarding"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={<Navigate to="/platform/onboarding" replace />}
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'TENANT_ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant-first-setup"
          element={
            <ProtectedRoute allowedRoles={['TENANT_ADMIN']}>
              <TenantFirstLoginSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'TENANT_ADMIN']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/login-history"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <LoginHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/menus"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformMenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/roles"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformAuthorityManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/role-menus"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <Navigate to="/platform/roles" replace />
            </ProtectedRoute>
          }
        />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/document-history" element={<DocumentHistoryPage />} />
        <Route path="/account/password" element={<AccountPasswordPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
