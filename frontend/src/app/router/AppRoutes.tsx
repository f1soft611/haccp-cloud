import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { LoginPage } from '../../pages/auth/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../../pages/DashboardPage';
import { OnboardingPage } from '../../pages/platform-admin/tenants/OnboardingPage';
import { UsersPage } from '../../pages/organization/users/UsersPage';
import { DepartmentsPage } from '../../pages/organization/departments/DepartmentsPage';
import { DocumentsPage } from '../../pages/documents/DocumentsPage';
import { DocumentHistoryPage } from '../../pages/documents/DocumentHistoryPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { TenantFirstLoginSetupPage } from '../../pages/platform-admin/tenants/TenantFirstLoginSetupPage';
import { LoginHistoryPage } from '../../pages/platform-admin/login-history/LoginHistoryPage';
import { PlatformMenuManagementPage } from '../../pages/platform-admin/menus/PlatformMenuManagementPage';
import { PlatformAuthorityManagementPage } from '../../pages/organization/authorities/PlatformAuthorityManagementPage';
import { PlatformTenantManagementPage } from '../../pages/platform-admin/tenants/PlatformTenantManagementPage';
import { PlatformPlanManagementPage } from '../../pages/platform-admin/plans/PlatformPlanManagementPage';
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
      <Route path="/login/:domain" element={<LoginPage />} />
      <Route
        path="/login/platform"
        element={<Navigate to="/login" replace />}
      />
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
          path="/platform/tenants"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformTenantManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={<Navigate to="/platform/onboarding" replace />}
        />
        <Route
          path="/org/users"
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
          path="/org/departments"
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
          path="/platform/plans"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformPlanManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org/roles"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformAuthorityManagementPage />
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
