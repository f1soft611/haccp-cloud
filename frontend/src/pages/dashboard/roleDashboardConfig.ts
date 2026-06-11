import type { UserRole } from '../../shared/store/authStore';

export type DashboardViewType = 'legacy' | 'platformAdmin';

type RoleDashboardEntry = {
  view: DashboardViewType;
};

export const ROLE_DASHBOARD_CONFIG: Record<UserRole, RoleDashboardEntry> = {
  PLATFORM_ADMIN: { view: 'platformAdmin' },
  TENANT_ADMIN: { view: 'legacy' },
  USER: { view: 'legacy' },
};

export function getDashboardConfigByRole(role: UserRole): RoleDashboardEntry {
  return ROLE_DASHBOARD_CONFIG[role] ?? { view: 'legacy' };
}
