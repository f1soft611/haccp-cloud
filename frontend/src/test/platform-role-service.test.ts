import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  listPlatformRolesPaged,
  listPlatformRoles,
  updatePlatformRole,
} from '../services/platform/platformRoleService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

describe('platformRoleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps authorityDc from role list responses into description', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          authorityCode: 'QA_MANAGER',
          authorityNm: '품질 관리자',
          authorityDc: '품질 승인 권한',
          useAt: 'Y',
        },
      ],
    });

    const roles = await listPlatformRoles();

    expect(roles).toEqual([
      expect.objectContaining({
        code: 'QA_MANAGER',
        name: '품질 관리자',
        description: '품질 승인 권한',
        active: true,
      }),
    ]);
  });

  it('sends authorityDc together with description on update', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        authorityCode: 'QA_MANAGER',
        authorityNm: '품질 관리자',
        authorityDc: '품질 승인 권한',
        useAt: 'Y',
      },
    });

    await updatePlatformRole({
      code: 'QA_MANAGER',
      name: '품질 관리자',
      description: '품질 승인 권한',
      active: true,
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/platform-admin/roles/QA_MANAGER',
      expect.objectContaining({
        description: '품질 승인 권한',
        authorityDc: '품질 승인 권한',
      }),
    );
  });

  it('calls paged endpoint and normalizes paged role list', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          roleList: [
            {
              authorityCode: 'TENANT_ADMIN',
              authorityNm: '업체 관리자',
              authorityDc: '업체 운영 권한',
              useAt: 'Y',
            },
          ],
          totalCount: 7,
        },
      },
    });

    const response = await listPlatformRolesPaged({
      pageIndex: 2,
      pageSize: 20,
      searchField: 'name',
      searchKeyword: '관리자',
      useAt: 'Y',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/roles/paged', {
      params: {
        pageIndex: 2,
        pageSize: 20,
        searchField: 'name',
        searchKeyword: '관리자',
        useAt: 'Y',
      },
    });
    expect(response.totalCount).toBe(7);
    expect(response.items[0]).toMatchObject({
      code: 'TENANT_ADMIN',
      name: '업체 관리자',
      description: '업체 운영 권한',
    });
  });
});
