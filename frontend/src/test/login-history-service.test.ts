import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { getLoginHistoryList } from '../services/platform-admin/loginHistoryService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('loginHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls backend login history list endpoint with query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          loginHistoryList: [],
          totalCount: 0,
        },
      },
    });

    await getLoginHistoryList({
      pageIndex: 2,
      pageSize: 20,
      factoryCode: 'TENANT-A',
      searchUserId: 'platform_admin',
      searchLoginResult: 'Y',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/login-history/list',
      {
        params: {
          pageIndex: 2,
          pageSize: 20,
          factoryCode: 'TENANT-A',
          searchUserId: 'platform_admin',
          searchLoginResult: 'Y',
        },
      },
    );
  });

  it('normalizes login history list from ResultVO wrapper', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          loginHistoryList: [
            {
              loginHistoryId: 100,
              userId: 'platform_admin',
              userName: '플랫폼관리자',
              loginDt: '2026-06-12 09:00:00',
              loginType: 'JWT_ADMIN',
              loginResult: 'Y',
              loginIp: '127.0.0.1',
            },
          ],
          totalCount: 1,
        },
      },
    });

    const response = await getLoginHistoryList({ pageIndex: 1, pageSize: 10 });

    expect(response.totalCount).toBe(1);
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toMatchObject({
      loginHistoryId: 100,
      userId: 'platform_admin',
      loginResult: 'Y',
    });
  });

  it('falls back to legacy endpoint when namespaced endpoint is not found', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          result: {
            loginHistoryList: [],
            totalCount: 0,
          },
        },
      });

    await getLoginHistoryList({ pageIndex: 1, pageSize: 10 });

    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/platform-admin/login-history/list',
      expect.anything(),
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      '/platform-admin/login-history',
      expect.anything(),
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(
      3,
      '/loginHistory/list',
      expect.anything(),
    );
  });
});
