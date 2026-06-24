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
      screen.getByText(/도메인 기반 로그인 라우팅이 적용되었습니다\./),
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-footer-copyright')).toHaveTextContent(
      '© F1soft Inc.',
    );
  });
});
