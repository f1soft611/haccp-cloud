import type { UserRole } from '../store/authStore';

export type DashboardViewType = 'legacy' | 'platformAdmin';

type DashboardRoutingInput = {
  role: UserRole;
  planCode?: string | null;
};

type DashboardRule = {
  planCode: string;
  role?: UserRole;
  landingPath: '/platform' | '/dashboard';
  view: DashboardViewType;
};

const DASHBOARD_RULES: DashboardRule[] = [
  {
    planCode: 'P',
    role: 'PLATFORM_ADMIN',
    landingPath: '/platform',
    view: 'platformAdmin',
  },
];

function normalizePlanCode(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function resolveRule(input: DashboardRoutingInput): DashboardRule | null {
  const normalizedPlanCode = normalizePlanCode(input.planCode);

  if (!normalizedPlanCode) {
    return null;
  }

  return (
    DASHBOARD_RULES.find((rule) => {
      if (rule.planCode !== normalizedPlanCode) {
        return false;
      }

      return rule.role ? rule.role === input.role : true;
    }) ?? null
  );
}

export function resolveDashboardLandingPath(
  input: DashboardRoutingInput,
): '/platform' | '/dashboard' {
  return resolveRule(input)?.landingPath ?? '/dashboard';
}

export function resolveDashboardViewType(
  input: DashboardRoutingInput,
): DashboardViewType {
  return resolveRule(input)?.view ?? 'legacy';
}
