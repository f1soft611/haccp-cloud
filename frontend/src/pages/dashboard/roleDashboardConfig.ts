import type { UserRole } from '../../shared/store/authStore';
import {
  resolveDashboardViewType,
  type DashboardViewType,
} from '../../shared/utils/dashboardRouting';

type RoleDashboardEntry = {
  view: DashboardViewType;
};

export function getDashboardConfigByContext(input: {
  role: UserRole;
  planCode?: string;
}): RoleDashboardEntry {
  return {
    view: resolveDashboardViewType(input),
  };
}
