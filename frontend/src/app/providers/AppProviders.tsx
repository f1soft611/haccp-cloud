import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { getThemeByMode } from '../theme';
import { FeedbackProvider } from '../../shared/providers/FeedbackProvider';
import { useAuthStore } from '../../shared/store/authStore';
import {
  getStoredThemeMode,
  THEME_MODE_CHANGE_EVENT,
  type ThemeModePreference,
} from '../../shared/theme/themePreference';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.userId);
  const themeStorageUserId = isAuthenticated ? userId : undefined;
  const [themeMode, setThemeMode] = useState<ThemeModePreference>(
    () => getStoredThemeMode(themeStorageUserId) ?? 'light',
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeMode(getStoredThemeMode(themeStorageUserId) ?? 'light');
  }, [themeStorageUserId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncThemeMode = () => {
      setThemeMode(getStoredThemeMode(themeStorageUserId) ?? 'light');
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('haccp.theme.mode')) {
        return;
      }

      syncThemeMode();
    };

    window.addEventListener(THEME_MODE_CHANGE_EVENT, syncThemeMode);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_MODE_CHANGE_EVENT, syncThemeMode);
      window.removeEventListener('storage', handleStorage);
    };
  }, [themeStorageUserId]);

  const theme = useMemo(() => getThemeByMode(themeMode), [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <FeedbackProvider>
          <CssBaseline />
          <BrowserRouter>{children}</BrowserRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
