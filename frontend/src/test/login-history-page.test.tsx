import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { LoginHistoryPage } from '../pages/admin/LoginHistoryPage';
import { APP_LABELS } from '../shared/constants/labels';

vi.mock('../services/auth/loginHistoryService', () => ({
  getLoginHistoryList: vi.fn(async () => ({
    items: [],
    totalCount: 0,
  })),
}));

describe('LoginHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders platform management style header and explicit search action', async () => {
    render(
      <AppProviders>
        <LoginHistoryPage />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', {
        name: APP_LABELS.pageTitle.loginHistory,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_LABELS.menu.systemGroup)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '조회' })).toBeInTheDocument();
  });
});
