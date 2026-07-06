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
      '/v1/platform-admin/login-history',
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

  it('throws when both v1 login history endpoints are not found', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockRejectedValueOnce({ response: { status: 404 } });

    await expect(
      getLoginHistoryList({ pageIndex: 1, pageSize: 10 }),
    ).rejects.toThrow('로그인 이력 조회 API 엔드포인트를 찾을 수 없습니다.');

    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/v1/platform-admin/login-history',
      expect.anything(),
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      '/v1/platform-admin/login-history/list',
      expect.anything(),
    );
  });

  it('normalizes login history list from result.data wrapper', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          data: {
            loginHistoryList: [
              {
                loginHistoryId: 200,
                userId: 'tenant_admin',
                userName: '테넌트관리자',
                loginDt: '2026-07-03 09:00:00',
                loginResult: 'N',
                failReason: '비밀번호 오류',
              },
            ],
            totalCount: 1,
          },
        },
      },
    });

    const response = await getLoginHistoryList({ pageIndex: 1, pageSize: 10 });

    expect(response.totalCount).toBe(1);
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toMatchObject({
      loginHistoryId: 200,
      userId: 'tenant_admin',
      loginResult: 'N',
    });
  });
});
