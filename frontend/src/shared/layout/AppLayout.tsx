import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopGovBar />
      <PageShell>
        <Outlet />
      </PageShell>
      <PortalFooter />
    </Box>
  );
}
