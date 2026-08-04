type Loader = () => Promise<unknown>;

type RouteLoader = {
  key: string;
  matches: (path: string) => boolean;
  load: Loader;
};

export const loadLoginPage = () => import('../../pages/auth/LoginPage');
export const loadDashboardPage = () => import('../../pages/DashboardPage');
export const loadOnboardingPage = () =>
  import('../../pages/platform-admin/tenants/OnboardingPage');
export const loadUsersPage = () =>
  import('../../pages/organization/users/UsersPage');
export const loadDepartmentsPage = () =>
  import('../../pages/organization/departments/DepartmentsPage');
export const loadDocumentsPage = () =>
  import('../../pages/documents/DocumentsPage');
export const loadDocumentHistoryPage = () =>
  import('../../pages/documents/DocumentHistoryPage');
export const loadNotFoundPage = () => import('../../pages/NotFoundPage');
export const loadTenantFirstLoginSetupPage = () =>
  import('../../pages/platform-admin/tenants/TenantFirstLoginSetupPage');
export const loadLoginHistoryPage = () =>
  import('../../pages/platform-admin/login-history/LoginHistoryPage');
export const loadPlatformMenuManagementPage = () =>
  import('../../pages/platform-admin/menus/PlatformMenuManagementPage');
export const loadPlatformAuthorityManagementPage = () =>
  import('../../pages/organization/authorities/PlatformAuthorityManagementPage');
export const loadPlatformTenantManagementPage = () =>
  import('../../pages/platform-admin/tenants/PlatformTenantManagementPage');
export const loadPlatformTenantDetailPage = () =>
  import('../../pages/platform-admin/tenants/PlatformTenantDetailPage');
export const loadPlatformPlanManagementPage = () =>
  import('../../pages/platform-admin/plans/PlatformPlanManagementPage');
export const loadAccountPasswordPage = () =>
  import('../../pages/account/AccountPasswordPage');
export const loadMyPage = () => import('../../pages/account/MyPage');
export const loadOnboardingVerifyPage = () =>
  import('../../pages/platform-admin/tenants/OnboardingVerifyPage');
export const loadHaccpBaseManagementPage = () =>
  import('../../pages/documents/haccp-base/HaccpBaseManagementPage');
export const loadHaccpBaseEditorPage = () =>
  import('../../pages/documents/haccp-base/HaccpBaseEditorPage');
export const loadHaccpBaseCategoryManagementPage = () =>
  import('../../pages/documents/haccp-base/HaccpBaseCategoryManagementPage');
export const loadHaccpDocumentManagementPage = () =>
  import('../../pages/documents/haccp-doc/HaccpDocumentManagementPage');
export const loadHaccpPortalPage = () =>
  import('../../pages/documents/portal/HaccpPortalPage');
export const loadApprovalDraftWritePage = () =>
  import('../../pages/documents/approvals/ApprovalDraftWritePage');

const prefetchedRouteKeys = new Set<string>();
const inflightRoutePrefetches = new Map<string, Promise<void>>();

function normalizePath(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\/+$/, '') || '/';
}

const routeLoaders: RouteLoader[] = [
  {
    key: 'login',
    matches: (path) => path === '/login' || path.startsWith('/login/'),
    load: loadLoginPage,
  },
  {
    key: 'onboarding-verify',
    matches: (path) => path === '/onboarding/verify',
    load: loadOnboardingVerifyPage,
  },
  {
    key: 'dashboard',
    matches: (path) => path === '/dashboard' || path === '/platform',
    load: loadDashboardPage,
  },
  {
    key: 'platform-onboarding',
    matches: (path) =>
      path === '/platform/onboarding' || path === '/onboarding',
    load: loadOnboardingPage,
  },
  {
    key: 'platform-tenants',
    matches: (path) => path === '/platform/tenants',
    load: loadPlatformTenantManagementPage,
  },
  {
    key: 'platform-tenant-detail',
    matches: (path) => path.startsWith('/platform/tenants/'),
    load: loadPlatformTenantDetailPage,
  },
  {
    key: 'users',
    matches: (path) => path === '/org/users' || path === '/users',
    load: loadUsersPage,
  },
  {
    key: 'tenant-first-setup',
    matches: (path) => path === '/tenant-first-setup',
    load: loadTenantFirstLoginSetupPage,
  },
  {
    key: 'departments',
    matches: (path) => path === '/org/departments' || path === '/departments',
    load: loadDepartmentsPage,
  },
  {
    key: 'login-history',
    matches: (path) => path === '/platform/login-history',
    load: loadLoginHistoryPage,
  },
  {
    key: 'platform-menus',
    matches: (path) => path === '/platform/menus',
    load: loadPlatformMenuManagementPage,
  },
  {
    key: 'platform-plans',
    matches: (path) => path === '/platform/plans',
    load: loadPlatformPlanManagementPage,
  },
  {
    key: 'roles',
    matches: (path) => path === '/org/roles' || path === '/roles',
    load: loadPlatformAuthorityManagementPage,
  },
  {
    key: 'documents',
    matches: (path) => path === '/documents',
    load: loadDocumentsPage,
  },
  {
    key: 'document-history',
    matches: (path) => path === '/document-history',
    load: loadDocumentHistoryPage,
  },
  {
    key: 'haccp-base',
    matches: (path) => path === '/docs/haccp-base',
    load: loadHaccpBaseManagementPage,
  },
  {
    key: 'haccp-base-editor',
    matches: (path) => path.startsWith('/docs/haccp-base/editor/'),
    load: loadHaccpBaseEditorPage,
  },
  {
    key: 'haccp-base-categories',
    matches: (path) => path === '/docs/haccp-base/categories',
    load: loadHaccpBaseCategoryManagementPage,
  },
  {
    key: 'haccp-doc',
    matches: (path) => path === '/docs/haccp-doc',
    load: loadHaccpDocumentManagementPage,
  },
  {
    key: 'portal',
    matches: (path) => path === '/docs/portal',
    load: loadHaccpPortalPage,
  },
  {
    key: 'approval-draft',
    matches: (path) => path.startsWith('/approvals/draft/'),
    load: loadApprovalDraftWritePage,
  },
  {
    key: 'account-my-page',
    matches: (path) => path === '/account/my-page' || path === '/account',
    load: loadMyPage,
  },
  {
    key: 'account-password',
    matches: (path) => path === '/account/password',
    load: loadAccountPasswordPage,
  },
  {
    key: 'not-found',
    matches: (path) => path === '/404',
    load: loadNotFoundPage,
  },
];

function prefetchByRouteLoader(routeLoader: RouteLoader): Promise<void> {
  if (prefetchedRouteKeys.has(routeLoader.key)) {
    return Promise.resolve();
  }

  const inflight = inflightRoutePrefetches.get(routeLoader.key);
  if (inflight) {
    return inflight;
  }

  const task = routeLoader
    .load()
    .then(() => {
      prefetchedRouteKeys.add(routeLoader.key);
    })
    .catch(() => {
      // Ignore network/load errors for best-effort prefetch.
    })
    .finally(() => {
      inflightRoutePrefetches.delete(routeLoader.key);
    });

  inflightRoutePrefetches.set(routeLoader.key, task);
  return task;
}

export function prefetchRouteByPath(path: string): Promise<void> {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return Promise.resolve();
  }

  const target = routeLoaders.find((routeLoader) =>
    routeLoader.matches(normalizedPath),
  );

  if (!target) {
    return Promise.resolve();
  }

  return prefetchByRouteLoader(target);
}

export function prefetchRoutesByPath(
  paths: string[],
  limit = 4,
): Promise<void> {
  const normalizedUniquePaths = [...new Set(paths.map(normalizePath))]
    .filter(Boolean)
    .slice(0, limit);

  return Promise.all(
    normalizedUniquePaths.map((path) => prefetchRouteByPath(path)),
  ).then(() => undefined);
}

export function scheduleRoutePrefetch(paths: string[], limit = 4): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (import.meta.env.MODE === 'test') {
    return;
  }

  const run = () => {
    void prefetchRoutesByPath(paths, limit);
  };

  const requestIdle = (
    window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
    }
  ).requestIdleCallback;

  if (typeof requestIdle === 'function') {
    requestIdle(run, { timeout: 1200 });
    return;
  }

  window.setTimeout(run, 180);
}
