import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../app/router/AppRoutes';
import { appTheme } from '../app/theme';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';

vi.mock('../services/organization/tenantService', async () => {
  const actual = await vi.importActual(
    '../services/organization/tenantService',
  );

  return {
    ...actual,
    getTenantByDomain: vi.fn(async (domain: string) => {
      if (domain === 'f1soft.co.kr') {
        return {
          tenantId: 1,
          tenantCode: 'PLATFORM',
          tenantNm: '에프원소프트',
          logoImage: '',
        };
      }

      return null;
    }),
  };
});

function renderAt(path: string) {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Login domain route', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders tenant-branded heading for /login/:domain', async () => {
    renderAt('/login/f1soft.co.kr');

    expect(
      await screen.findByRole('heading', { name: '에프원소프트에 로그인' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument();
    expect(screen.queryByText('다른 ID로 로그인')).not.toBeInTheDocument();
    expect(screen.getByText('다른 도메인으로 로그인')).toBeInTheDocument();
  });

  it('prefills remembered ID and starts at password step for domain login', async () => {
    window.localStorage.setItem(
      'haccp.last-login-userid.f1soft.co.kr',
      'socra710',
    );

    renderAt('/login/f1soft.co.kr');

    const idInput = await screen.findByLabelText('사용자 ID');
    expect(idInput).toHaveValue('socra710');
    expect(await screen.findByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByText('다른 ID로 로그인')).toBeInTheDocument();
    expect(
      screen.queryByText('다른 도메인으로 로그인'),
    ).not.toBeInTheDocument();
  });

  it('returns to ID step when clicking other ID login link', async () => {
    window.localStorage.setItem(
      'haccp.last-login-userid.f1soft.co.kr',
      'socra710',
    );

    renderAt('/login/f1soft.co.kr');

    fireEvent.click(await screen.findByText('다른 ID로 로그인'));

    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument();
  });

  it('clears ID field and shows recent domain prompt when switching to other domain login', async () => {
    window.localStorage.setItem('haccp.last-login-domain', 'f1soft.co.kr');

    renderAt('/login/f1soft.co.kr');

    const idInput = await screen.findByLabelText('사용자 ID');
    fireEvent.change(idInput, { target: { value: 'socra710' } });
    fireEvent.click(screen.getByText('다른 도메인으로 로그인'));

    const rootLoginIdInput = await screen.findByLabelText('사용자 ID');
    expect(rootLoginIdInput).toHaveValue('');
    expect(
      screen.getByText('최근 로그인 도메인: f1soft.co.kr'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '적용' })).toBeInTheDocument();
  });

  it('shows fallback logo sample when tenant logo is missing', async () => {
    renderAt('/login/f1soft.co.kr');

    expect(
      await screen.findByTestId('login-fallback-logo'),
    ).toBeInTheDocument();
  });

  it('moves to password step when Enter is pressed on ID field', async () => {
    renderAt('/login/f1soft.co.kr');

    const idInput = await screen.findByLabelText('사용자 ID');
    fireEvent.change(idInput, { target: { value: 'socra710' } });
    fireEvent.keyDown(idInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('focuses password field after clicking next in ID step', async () => {
    renderAt('/login/f1soft.co.kr');

    const idInput = await screen.findByLabelText('사용자 ID');
    fireEvent.change(idInput, { target: { value: 'socra710' } });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    const passwordInput = await screen.findByLabelText('비밀번호');
    await waitFor(() => {
      expect(passwordInput).toHaveFocus();
    });
  });

  it('falls back to generic login when domain lookup fails', async () => {
    renderAt('/login/alpha-food.co.kr');

    expect(
      await screen.findByRole('heading', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/오피스에 로그인/)).not.toBeInTheDocument();
  });

  it('keeps generic login screen at /login when there is no login history', async () => {
    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/오피스에 로그인/)).not.toBeInTheDocument();
  });

  it('auto-enters domain login at /login when last domain exists', async () => {
    window.localStorage.setItem('haccp.last-login-domain', 'f1soft.co.kr');

    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: '에프원소프트에 로그인' }),
    ).toBeInTheDocument();
  });
});
