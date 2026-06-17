import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { WorkMenuBar } from './WorkMenuBar';
import { getWorkMenuGroups } from './workMenuConfig';
import { useAuthStore } from '../../store/authStore';

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const menuGroups = getWorkMenuGroups(role);
  const location = useLocation();
  const navigate = useNavigate();

  const allowedPaths = menuGroups.flatMap((group) =>
    group.items
      .filter((item) => item.roles.includes(role))
      .map((item) => item.path),
  );

  useEffect(() => {
    if (allowedPaths.length === 0) {
      return;
    }
    const isAllowed = allowedPaths.some((path) =>
      location.pathname.startsWith(path),
    );
    if (!isAllowed) {
      navigate(allowedPaths[0], { replace: true });
    }
  }, [allowedPaths, location.pathname, navigate]);

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
