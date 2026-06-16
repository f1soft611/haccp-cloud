import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../../services/logoutService';
import { useAuthStore } from '../store/authStore';
import { APP_LABELS } from '../ui/labels';

export function TopGovBar() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const loginHistoryId = useAuthStore((state) => state.loginHistoryId);
  const clearAuth = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logoutApi(loginHistoryId);
    } catch {
      // Force local logout even if backend call fails.
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <Box
      data-testid="top-gov-bar"
      sx={{
        bgcolor: 'common.white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          bgcolor: '#EEF4FB',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container sx={{ py: 0.75 }}>
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'left' }}
          >
            {APP_LABELS.header.govNotice}
          </Typography>
        </Container>
      </Box>

      <Container>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ py: 1.4 }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ letterSpacing: 0.2, textAlign: 'left' }}
          >
            {APP_LABELS.appTitle} {APP_LABELS.appSubtitle}
          </Typography>

          {isAuthenticated && role !== 'PLATFORM_ADMIN' ? (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                void handleLogout();
              }}
              sx={{ minWidth: 96, fontWeight: 700 }}
            >
              {APP_LABELS.action.logout}
            </Button>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
