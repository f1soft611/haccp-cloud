import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { getCurrentPlanAccess } from '../services/platform-admin/planAccessService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('planAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes explicit auth headers when loading current plan access', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        tenantId: 1,
        tenantCode: '000001',
        planCode: 'P',
        features: {
          FEATURE_PLATFORM_TENANT_MGMT: true,
        },
      },
    });

    const result = await getCurrentPlanAccess({
      accessToken: 'token-platform-admin',
      tenantCode: '000001',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/platform-admin/plan-access/me',
      {
        headers: {
          Authorization: 'Bearer token-platform-admin',
          'x-tenant-code': '000001',
        },
      },
    );
    expect(result.planCode).toBe('P');
  });
});
