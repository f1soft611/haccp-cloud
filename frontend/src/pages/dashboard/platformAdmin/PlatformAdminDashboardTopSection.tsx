import { Button, Grid, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../../../shared/store/authStore';
import { APP_LABELS } from '../../../shared/constants/labels';

type QuickMenuItem = {
  label: string;
  to: string;
  enabled: boolean;
};

const QUICK_MENUS: Record<UserRole, QuickMenuItem[]> = {
  PLATFORM_ADMIN: [
    { label: APP_LABELS.menu.dashboard, to: '/platform', enabled: true },
    {
      label: APP_LABELS.menu.onboarding,
      to: '/platform/onboarding',
      enabled: true,
    },
    {
      label: APP_LABELS.menu.platformMenuManagement,
      to: '/platform/menus',
      enabled: true,
    },
    {
      label: APP_LABELS.menu.platformRoleManagement,
      to: '/platform/roles',
      enabled: true,
    },
    {
      label: APP_LABELS.menu.loginHistory,
      to: '/platform/login-history',
      enabled: true,
    },
  ],
  TENANT_ADMIN: [
    { label: APP_LABELS.menu.dashboard, to: '/dashboard', enabled: true },
    { label: APP_LABELS.menu.users, to: '/org/users', enabled: true },
    {
      label: APP_LABELS.menu.departments,
      to: '/org/departments',
      enabled: true,
    },
    { label: APP_LABELS.menu.documents, to: '/documents', enabled: true },
  ],
  USER: [
    { label: APP_LABELS.menu.dashboard, to: '/dashboard', enabled: true },
    { label: APP_LABELS.menu.documents, to: '/documents', enabled: true },
    { label: APP_LABELS.menu.history, to: '/document-history', enabled: true },
  ],
};

type PlatformAdminDashboardTopSectionProps = {
  loginRole: UserRole;
};

export function PlatformAdminDashboardTopSection({
  loginRole,
}: PlatformAdminDashboardTopSectionProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid size={{ xs: 12 }}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: isDarkMode
              ? 'rgba(45,212,191,0.36)'
              : 'rgba(20,184,166,0.22)',
            bgcolor: isDarkMode ? 'rgba(15,23,42,0.82)' : '#eef7ff',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: isDarkMode ? '#e2e8f0' : 'text.primary' }}
          >
            {APP_LABELS.dashboard.platformAdmin.topbar.quickMenuLabel}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.2 }}>
            {QUICK_MENUS[loginRole]
              .filter((item) => item.enabled)
              .map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    color: isDarkMode ? '#f8fafc' : undefined,
                    borderColor: isDarkMode
                      ? 'rgba(251,191,36,0.72)'
                      : undefined,
                    '&:hover': {
                      borderColor: isDarkMode
                        ? 'rgba(251,191,36,0.96)'
                        : undefined,
                      bgcolor: isDarkMode ? 'rgba(251,191,36,0.12)' : undefined,
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
