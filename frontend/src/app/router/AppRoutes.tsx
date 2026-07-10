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
import { PlatformTenantDetailPage } from '../../pages/platform-admin/tenants/PlatformTenantDetailPage';
import { PlatformPlanManagementPage } from '../../pages/platform-admin/plans/PlatformPlanManagementPage';
import { AccountPasswordPage } from '../../pages/account/AccountPasswordPage';
import { MyPage } from '../../pages/account/MyPage';
import { OnboardingVerifyPage } from '../../pages/platform-admin/tenants/OnboardingVerifyPage';
import { HaccpBaseManagementPage } from '../../pages/documents/haccp-base/HaccpBaseManagementPage';
import { HaccpBaseEditorPage } from '../../pages/documents/haccp-base/HaccpBaseEditorPage';
import { HaccpBaseCategoryManagementPage } from '../../pages/documents/haccp-base/HaccpBaseCategoryManagementPage';
import { useAuthStore } from '../../shared/store/authStore';
import { resolveDashboardLandingPath } from '../../shared/utils/dashboardRouting';

function DefaultHomeRoute() {
  const role = useAuthStore((state) => state.role);
  const planCode = useAuthStore((state) => state.planCode);
  const defaultPath = resolveDashboardLandingPath({ role, planCode });

  return <Navigate to={defaultPath} replace />;
}
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:domain" element={<LoginPage />} />
      <Route path="/onboarding/verify" element={<OnboardingVerifyPage />} />
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
            <ProtectedRoute enforceMenuAccess>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/tenants"
          element={
            <ProtectedRoute enforceMenuAccess>
              <PlatformTenantManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/tenants/:tenantCode"
          element={
            <ProtectedRoute enforceMenuAccess>
              <PlatformTenantDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={<Navigate to="/platform/onboarding" replace />}
        />
        <Route path="/users" element={<Navigate to="/org/users" replace />} />
        <Route
          path="/org/users"
          element={
            <ProtectedRoute enforceMenuAccess>
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
          element={<Navigate to="/org/departments" replace />}
        />
        <Route
          path="/org/departments"
          element={
            <ProtectedRoute enforceMenuAccess>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/login-history"
          element={
            <ProtectedRoute enforceMenuAccess>
              <LoginHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/menus"
          element={
            <ProtectedRoute enforceMenuAccess>
              <PlatformMenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/plans"
          element={
            <ProtectedRoute enforceMenuAccess>
              <PlatformPlanManagementPage />
            </ProtectedRoute>
          }
        />
        <Route path="/roles" element={<Navigate to="/org/roles" replace />} />
        <Route
          path="/org/roles"
          element={
            <ProtectedRoute enforceMenuAccess>
              <PlatformAuthorityManagementPage />
            </ProtectedRoute>
          }
        />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/document-history" element={<DocumentHistoryPage />} />
        <Route
          path="/docs/haccp-base"
          element={
            <ProtectedRoute enforceMenuAccess>
              <HaccpBaseManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/haccp-base/editor/:baseId"
          element={
            <ProtectedRoute enforceMenuAccess>
              <HaccpBaseEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/haccp-base/categories"
          element={
            <ProtectedRoute enforceMenuAccess>
              <HaccpBaseCategoryManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={<Navigate to="/account/my-page" replace />}
        />
        <Route path="/account/my-page" element={<MyPage />} />
        <Route path="/account/password" element={<AccountPasswordPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
