import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../shared/layout/AppLayout';
import { LoginPage } from '../../pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../../pages/DashboardPage';
import { OnboardingPage } from '../../pages/OnboardingPage';
import { UsersPage } from '../../pages/UsersPage';
import { DepartmentsPage } from '../../pages/DepartmentsPage';
import { DocumentsPage } from '../../pages/DocumentsPage';
import { DocumentHistoryPage } from '../../pages/DocumentHistoryPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { TenantFirstLoginSetupPage } from '../../pages/TenantFirstLoginSetupPage';
import { PlatformAdminLoginPage } from '../../pages/PlatformAdminLoginPage';

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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
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
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/document-history" element={<DocumentHistoryPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
