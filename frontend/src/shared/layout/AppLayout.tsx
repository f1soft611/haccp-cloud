import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { WorkMenuBar } from './WorkMenuBar';
import { getWorkMenuGroups } from './workMenuConfig';
import { useAuthStore } from '../store/authStore';

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const menuGroups = getWorkMenuGroups(role);

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
