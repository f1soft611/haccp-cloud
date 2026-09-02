import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../shared/store/authStore';
import { resolveDashboardLandingPath } from '../../shared/utils/dashboardRouting';
import {
  loadAccountPasswordPage,
  loadApprovalDraftWritePage,
  loadDashboardPage,
  loadDepartmentsPage,
  loadDocumentHistoryPage,
  loadDocumentsPage,
  loadHaccpBaseCategoryManagementPage,
  loadHaccpBaseEditorPage,
  loadHaccpBaseManagementPage,
  loadHaccpDocumentManagementPage,
  loadHaccpPortalPage,
  loadLoginHistoryPage,
  loadLoginPage,
  loadMyPage,
  loadNotFoundPage,
  loadOnboardingPage,
  loadOnboardingVerifyPage,
  loadPlatformAuthorityManagementPage,
  loadPlatformMenuManagementPage,
  loadPlatformPlanManagementPage,
  loadPlatformTenantDetailPage,
  loadPlatformTenantManagementPage,
  loadTenantFirstLoginSetupPage,
  loadUsersPage,
    loadWorkCalendarPage,
} from './routePrefetch';

const LoginPage = lazy(() =>
  loadLoginPage().then((module) => ({
    default: module.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  loadDashboardPage().then((module) => ({
    default: module.DashboardPage,
  })),
);
const OnboardingPage = lazy(() =>
  loadOnboardingPage().then((module) => ({ default: module.OnboardingPage })),
);
const UsersPage = lazy(() =>
  loadUsersPage().then((module) => ({
    default: module.UsersPage,
  })),
);
const DepartmentsPage = lazy(() =>
  loadDepartmentsPage().then((module) => ({ default: module.DepartmentsPage })),
);
const DocumentsPage = lazy(() =>
  loadDocumentsPage().then((module) => ({
    default: module.DocumentsPage,
  })),
);
const DocumentHistoryPage = lazy(() =>
  loadDocumentHistoryPage().then((module) => ({
    default: module.DocumentHistoryPage,
  })),
);
const NotFoundPage = lazy(() =>
  loadNotFoundPage().then((module) => ({
    default: module.NotFoundPage,
  })),
);
const TenantFirstLoginSetupPage = lazy(() =>
  loadTenantFirstLoginSetupPage().then((module) => ({
    default: module.TenantFirstLoginSetupPage,
  })),
);
const LoginHistoryPage = lazy(() =>
  loadLoginHistoryPage().then((module) => ({
    default: module.LoginHistoryPage,
  })),
);
const PlatformMenuManagementPage = lazy(() =>
  loadPlatformMenuManagementPage().then((module) => ({
    default: module.PlatformMenuManagementPage,
  })),
);
const PlatformAuthorityManagementPage = lazy(() =>
  loadPlatformAuthorityManagementPage().then((module) => ({
    default: module.PlatformAuthorityManagementPage,
  })),
);
const PlatformTenantManagementPage = lazy(() =>
  loadPlatformTenantManagementPage().then((module) => ({
    default: module.PlatformTenantManagementPage,
  })),
);
const PlatformTenantDetailPage = lazy(() =>
  loadPlatformTenantDetailPage().then((module) => ({
    default: module.PlatformTenantDetailPage,
  })),
);
const PlatformPlanManagementPage = lazy(() =>
  loadPlatformPlanManagementPage().then((module) => ({
    default: module.PlatformPlanManagementPage,
  })),
);
const AccountPasswordPage = lazy(() =>
  loadAccountPasswordPage().then((module) => ({
    default: module.AccountPasswordPage,
  })),
);
const MyPage = lazy(() =>
  loadMyPage().then((module) => ({
    default: module.MyPage,
  })),
);
const OnboardingVerifyPage = lazy(() =>
  loadOnboardingVerifyPage().then((module) => ({
    default: module.OnboardingVerifyPage,
  })),
);
const HaccpBaseManagementPage = lazy(() =>
  loadHaccpBaseManagementPage().then((module) => ({
    default: module.HaccpBaseManagementPage,
  })),
);
const HaccpBaseEditorPage = lazy(() =>
  loadHaccpBaseEditorPage().then((module) => ({
    default: module.HaccpBaseEditorPage,
  })),
);
const HaccpBaseCategoryManagementPage = lazy(() =>
  loadHaccpBaseCategoryManagementPage().then((module) => ({
    default: module.HaccpBaseCategoryManagementPage,
  })),
);
const HaccpDocumentManagementPage = lazy(() =>
  loadHaccpDocumentManagementPage().then((module) => ({
    default: module.HaccpDocumentManagementPage,
  })),
);
const HaccpPortalPage = lazy(() =>
  loadHaccpPortalPage().then((module) => ({
    default: module.HaccpPortalPage,
  })),
);
const ApprovalDraftWritePage = lazy(() =>
  loadApprovalDraftWritePage().then((module) => ({
    default: module.ApprovalDraftWritePage,
  })),
);
const WorkCalendarPage = lazy(() =>
    loadWorkCalendarPage().then((module) => ({
        default: module.WorkCalendarPage,
    })),
);

function DefaultHomeRoute() {
  const role = useAuthStore((state) => state.role);
  const planCode = useAuthStore((state) => state.planCode);
  const defaultPath = resolveDashboardLandingPath({ role, planCode });

  return <Navigate to={defaultPath} replace />;
}
export function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/admin" element={<LoginPage adminMode />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:domain" element={<LoginPage />} />
        <Route path="/onboarding/verify" element={<OnboardingVerifyPage />} />
        <Route
          path="/login/platform"
          element={<Navigate to="/admin" replace />}
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
            path="/docs/haccp-doc"
            element={
              <ProtectedRoute enforceMenuAccess>
                <HaccpDocumentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docs/portal"
            element={
              <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'TENANT_ADMIN']}>
                <HaccpPortalPage />
              </ProtectedRoute>
            }
          />
            <Route
                path="/docs/work-calendar"
                element={
                    <ProtectedRoute>
                        <WorkCalendarPage />
                    </ProtectedRoute>
                }
            />
          <Route
            path="/approvals/draft/:baseId"
            element={
              <ProtectedRoute>
                <ApprovalDraftWritePage />
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
    </Suspense>
  );
}
