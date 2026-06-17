import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { appTheme } from '../theme';
import { FeedbackProvider } from '../../shared/providers/FeedbackProvider';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <CssBaseline />
          <BrowserRouter>{children}</BrowserRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
