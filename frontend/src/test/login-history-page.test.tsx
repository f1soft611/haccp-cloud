import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { LoginHistoryPage } from '../pages/platform-admin/login-history/LoginHistoryPage';
import { APP_LABELS } from '../shared/constants/labels';

const { getLoginHistoryListMock } = vi.hoisted(() => ({
  getLoginHistoryListMock: vi.fn(async () => ({
    items: [],
    totalCount: 0,
  })),
}));

vi.mock('../services/platform-admin/loginHistoryService', () => ({
  getLoginHistoryList: getLoginHistoryListMock,
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

    await waitFor(() => {
      expect(getLoginHistoryListMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 10,
          pageIndex: 1,
        }),
      );
    });

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: '페이지 크기 선택' }),
    );
    fireEvent.click(screen.getByRole('option', { name: '20개' }));

    await waitFor(() => {
      expect(getLoginHistoryListMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 20,
          pageIndex: 1,
        }),
      );
    });
  });
});
