import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../app/router/AppRoutes';
import { appTheme } from '../app/theme';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';
import { login } from '../services/auth/authService';
import { getTenantByTenantNo } from '../services/organization/tenantService';

vi.mock('../services/organization/tenantService', async () => {
  const actual = await vi.importActual(
      '../services/organization/tenantService',
  );

  return {
    ...actual,
    getTenantByTenantNo: vi.fn(async (tenantNo: string) =>
        tenantNo === '482913'
            ? { tenantNo: '482913', tenantNm: '알파푸드', logoImage: '' }
            : null,
    ),
  };
});

vi.mock('../services/auth/authService', async () => {
  const actual = await vi.importActual('../services/auth/authService');

  return {
    ...actual,
    login: vi.fn(async () => {
      throw new Error('로그인 정보가 올바르지 않습니다.');
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

describe('Login tenant number route', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(login).mockClear();
    vi.mocked(getTenantByTenantNo).mockClear();
  });

  it('renders tenant-branded heading for /login/:tenantNo', async () => {
    renderAt('/login/482913');

    expect(
        await screen.findByRole('heading', { name: '알파푸드에 로그인' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('업체번호')).not.toBeInTheDocument();
    expect(screen.getByText('다른 업체번호로 로그인')).toBeInTheDocument();
  });

  it('prefills remembered ID and starts at password step', async () => {
    window.localStorage.setItem('haccp.last-login-userid.482913', 'socra710');

    renderAt('/login/482913');

    const idInput = await screen.findByLabelText('사용자 ID');
    expect(idInput).toHaveValue('socra710');
    expect(await screen.findByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByText('다른 ID로 로그인')).toBeInTheDocument();
  });

  it('returns to ID step when clicking other ID login link', async () => {
    window.localStorage.setItem('haccp.last-login-userid.482913', 'socra710');

    renderAt('/login/482913');

    fireEvent.click(await screen.findByText('다른 ID로 로그인'));

    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument();
  });

  it('moves to empty 3-field login when clicking other tenant number link', async () => {
    window.localStorage.setItem('haccp.last-login-tenant-no', '482913');

    renderAt('/login/482913');

    fireEvent.change(await screen.findByLabelText('사용자 ID'), {
      target: { value: 'socra710' },
    });
    fireEvent.click(screen.getByText('다른 업체번호로 로그인'));

    expect(await screen.findByLabelText('업체번호')).toHaveValue('');
    expect(screen.getByLabelText('사용자 ID')).toHaveValue('');
  });

  it('shows fallback logo when tenant logo is missing', async () => {
    renderAt('/login/482913');

    expect(
        await screen.findByTestId('login-fallback-logo'),
    ).toBeInTheDocument();
  });

  it('moves to password step when Enter is pressed on ID field', async () => {
    renderAt('/login/482913');

    const idInput = await screen.findByLabelText('사용자 ID');
    fireEvent.change(idInput, { target: { value: 'socra710' } });
    fireEvent.keyDown(idInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('focuses password field after clicking next in ID step', async () => {
    renderAt('/login/482913');

    const idInput = await screen.findByLabelText('사용자 ID');
    fireEvent.change(idInput, { target: { value: 'socra710' } });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    const passwordInput = await screen.findByLabelText('비밀번호');
    await waitFor(() => {
      expect(passwordInput).toHaveFocus();
    });
  });

  it('falls back to 3-field login when tenant number lookup fails', async () => {
    renderAt('/login/999999');

    expect(
        await screen.findByRole('heading', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('업체번호')).toBeInTheDocument();
  });

  it('redirects legacy domain URL to /login without lookup', async () => {
    renderAt('/login/f1soft.co.kr');

    expect(await screen.findByLabelText('업체번호')).toBeInTheDocument();
    expect(getTenantByTenantNo).not.toHaveBeenCalled();
  });

  it('renders tenant number, ID and password fields at /login', async () => {
    renderAt('/login');

    expect(
        await screen.findByRole('heading', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('업체번호')).toHaveValue('');
    expect(screen.getByLabelText('사용자 ID')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('prefills last tenant number and its user ID at /login without redirect', async () => {
    window.localStorage.setItem('haccp.last-login-tenant-no', '482913');
    window.localStorage.setItem('haccp.last-login-userid.482913', 'socra710');

    renderAt('/login');

    expect(await screen.findByLabelText('업체번호')).toHaveValue('482913');
    expect(screen.getByLabelText('사용자 ID')).toHaveValue('socra710');
    expect(getTenantByTenantNo).not.toHaveBeenCalled();
  });

  it('keeps only digits in tenant number and requires 6 digits to submit', async () => {
    renderAt('/login');

    const tenantNoInput = await screen.findByLabelText('업체번호');
    fireEvent.change(tenantNoInput, { target: { value: 'ab48-29' } });
    fireEvent.change(screen.getByLabelText('사용자 ID'), {
      target: { value: 'socra710' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'pw' },
    });

    expect(tenantNoInput).toHaveValue('4829');
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
  });

  it('sends tenant number with ID as typed at /login', async () => {
    renderAt('/login');

    fireEvent.change(await screen.findByLabelText('업체번호'), {
      target: { value: '482913' },
    });
    fireEvent.change(screen.getByLabelText('사용자 ID'), {
      target: { value: 'socra710' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        userId: 'socra710',
        password: 'pw',
        tenantNo: '482913',
      });
    });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});