import { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { WorkMenuBar } from './WorkMenuBar';
import {
  filterWorkMenuGroupsByPaths,
  getWorkMenuGroups,
  toMenuIconName,
} from './workMenuConfig';
import { listAccessibleMenuPaths } from '../../../services/platform/platformUserMenuService';
import * as userMenuService from '../../../services/platform/platformUserMenuService';
import { getCurrentPlanAccess } from '../../../services/plan/planAccessService';
import {
  isFeatureAllowed,
  resolveFeatureCodeByPath,
} from '../../../services/plan/featureCatalog';
import { useAuthStore } from '../../store/authStore';
import { UserMenuMetadataProvider } from './userMenuMetadataContext';

const ALWAYS_ALLOWED_PATHS = [
  '/account/password',
  '/onboarding',
  '/platform/onboarding',
  '/tenant-first-setup',
];

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const location = useLocation();
  const navigate = useNavigate();

  let listAccessibleMenusFn:
    | (() => Promise<
        { path: string; menuNm?: string; menuDc?: string; iconNm?: string }[]
      >)
    | undefined;

  try {
    listAccessibleMenusFn = (
      userMenuService as { listAccessibleMenus?: typeof listAccessibleMenusFn }
    ).listAccessibleMenus;
  } catch {
    listAccessibleMenusFn = undefined;
  }

  const accessibleMenuQuery = useQuery({
    queryKey: ['user-accessible-menus'],
    queryFn: () => listAccessibleMenuPaths(),
    retry: false,
  });

  const accessibleMenuMetaQuery = useQuery({
    queryKey: ['user-accessible-menu-metadata'],
    queryFn: () =>
      typeof listAccessibleMenusFn === 'function'
        ? listAccessibleMenusFn()
        : Promise.resolve([]),
    enabled: typeof listAccessibleMenusFn === 'function',
    retry: false,
  });

  const planAccessQuery = useQuery({
    queryKey: ['current-plan-access'],
    queryFn: getCurrentPlanAccess,
    retry: false,
  });

  const roleDefaultMenuGroups = useMemo(() => getWorkMenuGroups(role), [role]);
  const roleDefaultPaths = useMemo(
    () =>
      roleDefaultMenuGroups.flatMap((group) =>
        group.items.map((item) => item.path),
      ),
    [roleDefaultMenuGroups],
  );

  const allowedPaths = useMemo(
    () =>
      accessibleMenuQuery.isError
        ? roleDefaultPaths
        : (accessibleMenuQuery.data ?? []),
    [accessibleMenuQuery.data, accessibleMenuQuery.isError, roleDefaultPaths],
  );

  const featureFilteredAllowedPaths = useMemo(() => {
    const features = planAccessQuery.data?.features;

    return allowedPaths.filter((path) =>
      isFeatureAllowed(features, resolveFeatureCodeByPath(path)),
    );
  }, [allowedPaths, planAccessQuery.data?.features]);

  const menuMetadataByPath = useMemo(() => {
    const metadataMap: Record<
      string,
      { menuNm?: string; menuDc?: string; iconNm?: string }
    > = {};

    (accessibleMenuMetaQuery.data ?? []).forEach((menu) => {
      metadataMap[menu.path] = {
        menuNm: menu.menuNm,
        menuDc: menu.menuDc,
        iconNm: menu.iconNm,
      };
    });

    return metadataMap;
  }, [accessibleMenuMetaQuery.data]);

  const isInitialMenuLoading =
    accessibleMenuQuery.isPending && accessibleMenuQuery.data === undefined;

  const menuGroups = useMemo(() => {
    if (isInitialMenuLoading) {
      return [];
    }

    const filteredGroups = filterWorkMenuGroupsByPaths(
      roleDefaultMenuGroups,
      featureFilteredAllowedPaths,
    );

    return filteredGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        const metadata = menuMetadataByPath[item.path];
        if (!metadata) {
          return item;
        }

        return {
          ...item,
          label: metadata.menuNm || item.label,
          description: metadata.menuDc || item.description,
          icon: toMenuIconName(metadata.iconNm) || item.icon,
        };
      }),
    }));
  }, [
    featureFilteredAllowedPaths,
    isInitialMenuLoading,
    menuMetadataByPath,
    roleDefaultMenuGroups,
  ]);

  const fallbackRedirectPath = useMemo(() => {
    if (
      role === 'PLATFORM_ADMIN' &&
      featureFilteredAllowedPaths.some((path) => path.startsWith('/platform'))
    ) {
      return '/platform';
    }

    return featureFilteredAllowedPaths[0];
  }, [featureFilteredAllowedPaths, role]);

  useEffect(() => {
    if (accessibleMenuQuery.isPending) {
      return;
    }

    if (
      ALWAYS_ALLOWED_PATHS.some((path) => location.pathname.startsWith(path))
    ) {
      return;
    }

    if (featureFilteredAllowedPaths.length === 0) {
      return;
    }
    const isAllowed = featureFilteredAllowedPaths.some((path) =>
      location.pathname.startsWith(path),
    );
    if (!isAllowed) {
      navigate(fallbackRedirectPath, { replace: true });
    }
  }, [
    accessibleMenuQuery.isPending,
    featureFilteredAllowedPaths,
    fallbackRedirectPath,
    location.pathname,
    navigate,
  ]);

  return (
    <UserMenuMetadataProvider value={menuMetadataByPath}>
      <Box
        sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <TopGovBar />
        <WorkMenuBar menuGroups={menuGroups} role={role} />
        <PageShell>
          <Outlet />
        </PageShell>
        <PortalFooter />
      </Box>
    </UserMenuMetadataProvider>
  );
}
