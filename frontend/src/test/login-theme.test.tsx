import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../app/App';
import { AppProviders } from '../app/providers/AppProviders';
import { storeThemeMode } from '../shared/theme/themePreference';
import { useAuthStore } from '../shared/store/authStore';

describe('login pages theme mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/login');
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

  it('applies stored dark theme to tenant login page', async () => {
    storeThemeMode(undefined, 'dark');

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByTestId('login-page-shell')).toHaveAttribute(
      'data-theme-mode',
      'dark',
    );
  });
});
