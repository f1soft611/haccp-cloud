import { Suspense, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { SideNav } from './SideNav';
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
import { scheduleRoutePrefetch } from '../../../app/router/routePrefetch';

// 왼쪽 메뉴바, 상단바, 본문을 묶는 로그인 후 공통 레이아웃.
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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

    // 기존 -> 단일 메뉴도 그룹명을 넘겨 상단 경로에 메뉴명이 두 번 표시됨
    // 변경 -> 단일 메뉴는 그룹명을 넘기지 않음
    return matchedGroup?.isSingleMenu ? undefined : matchedGroup?.label;
  }, [location.pathname, menuGroups]);

  const prioritizedPrefetchPaths = useMemo(() => {
    const activeGroup =
      menuGroups.find((group) =>
        group.items.some((item) => location.pathname.startsWith(item.path)),
      ) ?? menuGroups[0];

    const activePaths = (activeGroup?.items ?? []).map((item) => item.path);
    const fallbackPaths = menuGroups
      .flatMap((group) => group.items.map((item) => item.path))
      .filter((path) => !activePaths.includes(path));

    return ['/dashboard', ...activePaths, ...fallbackPaths];
  }, [location.pathname, menuGroups]);

  useEffect(() => {
    scheduleRoutePrefetch(prioritizedPrefetchPaths, 6);
  }, [prioritizedPrefetchPaths]);

  return (
      <UserMenuMetadataProvider value={menuMetadataByPath}>
        <CurrentMenuGroupLabelProvider value={currentMenuGroupLabel}>
          <Box
              sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
          >
            <TopGovBar onOpenMobileNav={() => setMobileNavOpen(true)} />
            <Box sx={{ flex: 1, display: 'flex' }}>
              <SideNav
                  menuGroups={menuGroups}
                  role={role}
                  mobileOpen={mobileNavOpen}
                  onMobileClose={() => setMobileNavOpen(false)}
              />
              <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
              >
                <PageShell>
                  <Suspense fallback={null}>
                    <Outlet />
                  </Suspense>
                </PageShell>
              </Box>
            </Box>
            <PortalFooter />
          </Box>
        </CurrentMenuGroupLabelProvider>
      </UserMenuMetadataProvider>
  );
}
