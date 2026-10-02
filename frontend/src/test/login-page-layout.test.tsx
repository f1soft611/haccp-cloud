import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../app/router/AppRoutes';
import { appTheme } from '../app/theme';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';

function renderLoginPage() {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
          </MemoryRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Login page layout', () => {
  it('shows notice bar and browser-bottom copyright text', async () => {
    renderLoginPage();

    expect(await screen.findByTestId('login-notice-bar')).toBeInTheDocument();
    expect(
        screen.getByText(/업체번호로 로그인할 수 있습니다\./),
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-footer-copyright')).toHaveTextContent(
      '© F1soft Inc.',
    );
  });
});
