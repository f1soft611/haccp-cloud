import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/apiClient';
import { getCurrentPlanAccess, listPlanSummaries } from '../../../services/platform-admin/planAccessService';

vi.mock('../../../services/api/apiClient', () => ({
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
          'x-tenant-code': 'PLATFORM',
        },
      },
    );
    expect(result.planCode).toBe('P');
  });

  it('sends plan search conditions as query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    await listPlanSummaries({ searchField: 'code', searchKeyword: 'B', useAt: 'Y' });
    await listPlanSummaries();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/v1/platform-admin/plan-access/plans', {
      params: { searchField: 'code', searchKeyword: 'B', useAt: 'Y' },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/v1/platform-admin/plan-access/plans', {
      params: { searchField: undefined, searchKeyword: undefined, useAt: undefined },
    });
  });
});
