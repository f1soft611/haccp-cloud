import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { WorkMenuBar } from './WorkMenuBar';
import {
  buildMenuGroupsFromAccessibleMenus,
  toMenuIconName,
} from './workMenuConfig';
import {
  listAccessibleMenuPaths,
  type AccessibleMenuMeta,
} from '../../../services/platform-admin/platformUserMenuService';
import * as userMenuService from '../../../services/platform-admin/platformUserMenuService';
import { useAuthStore } from '../../store/authStore';
import {
  CurrentMenuGroupLabelProvider,
  UserMenuMetadataProvider,
} from './userMenuMetadataContext';

export function AppLayout() {
  const location = useLocation();

  let listAccessibleMenusFn: (() => Promise<AccessibleMenuMeta[]>) | undefined;

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

  const role = useAuthStore((state) => state.role);
  const hasAccessibleMenuMetaApi = typeof listAccessibleMenusFn === 'function';

  const allowedPaths = useMemo(
    () => (accessibleMenuQuery.isError ? [] : (accessibleMenuQuery.data ?? [])),
    [accessibleMenuQuery.data, accessibleMenuQuery.isError],
  );

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

  const effectiveAccessibleMenus = useMemo<AccessibleMenuMeta[]>(() => {
    if ((accessibleMenuMetaQuery.data ?? []).length > 0) {
      return accessibleMenuMetaQuery.data ?? [];
    }

    if (hasAccessibleMenuMetaApi && accessibleMenuMetaQuery.isPending) {
      return [];
    }

    return allowedPaths.map((path) => ({
      path,
      menuNm: menuMetadataByPath[path]?.menuNm,
      menuDc: menuMetadataByPath[path]?.menuDc,
      iconNm: menuMetadataByPath[path]?.iconNm,
      parentMenuId: null,
    }));
  }, [
    accessibleMenuMetaQuery.data,
    accessibleMenuMetaQuery.isPending,
    allowedPaths,
    hasAccessibleMenuMetaApi,
    menuMetadataByPath,
  ]);

  const isInitialMenuLoading =
    (accessibleMenuQuery.isPending && accessibleMenuQuery.data === undefined) ||
    (hasAccessibleMenuMetaApi &&
      accessibleMenuMetaQuery.isPending &&
      (accessibleMenuMetaQuery.data ?? []).length === 0);

  const menuGroups = useMemo(() => {
    if (isInitialMenuLoading) {
      return [];
    }

    const dynamicGroups = buildMenuGroupsFromAccessibleMenus(
      role,
      effectiveAccessibleMenus,
      allowedPaths,
    );

    return dynamicGroups.map((group) => ({
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
    allowedPaths,
    isInitialMenuLoading,
    effectiveAccessibleMenus,
    menuMetadataByPath,
    role,
  ]);

  const currentMenuGroupLabel = useMemo(() => {
    const matchedGroup = menuGroups.find((group) =>
      group.items.some((item) => location.pathname.startsWith(item.path)),
    );

    return matchedGroup?.label;
  }, [location.pathname, menuGroups]);

  return (
    <UserMenuMetadataProvider value={menuMetadataByPath}>
      <CurrentMenuGroupLabelProvider value={currentMenuGroupLabel}>
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
      </CurrentMenuGroupLabelProvider>
    </UserMenuMetadataProvider>
  );
}
