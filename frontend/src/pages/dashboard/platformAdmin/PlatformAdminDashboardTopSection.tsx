import { Button, Grid, Paper, Stack, Typography } from '@mui/material';
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
  TENANT_USER: [
    { label: APP_LABELS.menu.dashboard, to: '/dashboard', enabled: true },
    { label: APP_LABELS.menu.documents, to: '/documents', enabled: true },
    { label: APP_LABELS.menu.history, to: '/document-history', enabled: true },
  ],
  // 기존 -> USER: [ dashboard, documents, history ] (TENANT_USER 와 동일)
  // 변경 -> UserRole 에서 'USER' 제거로 키 삭제
};

type PlatformAdminDashboardTopSectionProps = {
  loginRole: UserRole;
};

export function PlatformAdminDashboardTopSection({
  loginRole,
}: PlatformAdminDashboardTopSectionProps) {

  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid size={{ xs: 12 }}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            // 기존 -> isDarkMode 로 색 분기 / 변경 -> dashboard 토큰
            borderColor: 'dashboard.cardBorder',
            bgcolor: 'dashboard.quickMenuBg',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: 'dashboard.quickMenuText' }}
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
                  // 기존 -> color, borderColor, hover 를 isDarkMode 로 분기 (라이트는 undefined)
                  // 변경 -> 다크 전용 덮어쓰기를 applyStyles 로 분리
                  sx={[
                    { borderRadius: 2, fontWeight: 700 },
                    (theme) =>
                      theme.applyStyles('dark', {
                        color: '#f8fafc',
                        borderColor: 'rgba(251,191,36,0.72)',
                        '&:hover': {
                          borderColor: 'rgba(251,191,36,0.96)',
                          bgcolor: 'rgba(251,191,36,0.12)',
                        },
                      }),
                  ]}
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
