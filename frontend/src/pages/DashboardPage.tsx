import { getDashboardConfigByContext } from './dashboard/roleDashboardConfig';
import { PlatformAdminDashboard } from './dashboard/platformAdmin/PlatformAdminDashboard';
import { TenantDashboard } from './dashboard/tenant/TenantDashboard';
import { useAuthStore } from '../shared/store/authStore';

export function DashboardPage() {
  const role = useAuthStore((state) => state.role);
  const planCode = useAuthStore((state) => state.planCode);
  const dashboardConfig = getDashboardConfigByContext({ role, planCode });
  const isPlatformAdminView = dashboardConfig.view === 'platformAdmin';

  if (isPlatformAdminView) {
    return <PlatformAdminDashboard />;
  }

  return <TenantDashboard />;
}
