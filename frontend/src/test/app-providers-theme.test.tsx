import { act, render, screen } from '@testing-library/react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { useAuthStore } from '../shared/store/authStore';
import { storeThemeMode } from '../shared/theme/themePreference';

function ThemeModeProbe() {
  const theme = useTheme();

  return <Typography>{theme.palette.mode}</Typography>;
}

describe('AppProviders theme preference', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        tenantCode: '',
        userId: '',
        role: 'USER',
        accessToken: '',
        refreshToken: '',
        loginHistoryId: undefined,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });
  });

  it('restores stored dark theme for authenticated user', async () => {
    storeThemeMode('tenant_admin', 'dark');

    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-A',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        accessToken: 'token',
        refreshToken: 'refresh',
        loginHistoryId: 1,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    render(
      <AppProviders>
        <ThemeModeProbe />
      </AppProviders>,
    );

    expect(await screen.findByText('dark')).toBeInTheDocument();
  });
});
