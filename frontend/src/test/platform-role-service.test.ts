import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
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
});
