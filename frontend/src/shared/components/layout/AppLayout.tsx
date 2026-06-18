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
} from './workMenuConfig';
import { listAccessibleMenuPaths } from '../../../services/platform/platformUserMenuService';
import { toAuthorityCode } from '../../auth/authorityCode';
import { useAuthStore } from '../../store/authStore';

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const location = useLocation();
  const navigate = useNavigate();

  const authorityCode = toAuthorityCode(role);

  const accessibleMenuQuery = useQuery({
    queryKey: ['user-accessible-menus', authorityCode],
    queryFn: () => listAccessibleMenuPaths(authorityCode),
    retry: false,
  });

  const menuGroups = useMemo(
    () =>
      filterWorkMenuGroupsByPaths(
        getWorkMenuGroups(role),
        accessibleMenuQuery.data ?? [],
      ),
    [accessibleMenuQuery.data, role],
  );

  const fallbackAllowedPaths = useMemo(
    () => {
      return menuGroups.flatMap((group) =>
        group.items
          .filter((item) => item.roles.includes(role))
          .map((item) => item.path),
      );
    },
    [menuGroups, role],
  );

  const allowedPaths = useMemo(
    () =>
      accessibleMenuQuery.data && accessibleMenuQuery.data.length > 0
        ? accessibleMenuQuery.data
        : fallbackAllowedPaths,
    [accessibleMenuQuery.data, fallbackAllowedPaths],
  );

  useEffect(() => {
    if (accessibleMenuQuery.isPending) {
      return;
    }

    if (allowedPaths.length === 0) {
      return;
    }
    const isAllowed = allowedPaths.some((path) =>
      location.pathname.startsWith(path),
    );
    if (!isAllowed) {
      navigate(allowedPaths[0], { replace: true });
    }
  }, [accessibleMenuQuery.isPending, allowedPaths, location.pathname, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopGovBar />
      <WorkMenuBar menuGroups={menuGroups} role={role} />
      <PageShell>
        <Outlet />
      </PageShell>
      <PortalFooter />
    </Box>
  );
}
