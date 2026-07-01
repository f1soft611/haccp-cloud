import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  getPlatformTenantByCode,
  listPlatformTenants,
  type PlatformTenantManagementItem,
} from '../services/platform-admin/tenants/platformTenantManagementService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('platformTenantManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps dashboard tenant payload into platform tenant rows', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        summary: { total: 1, active: 1, inactive: 0 },
        items: [
          {
            tenantCode: 'TENANT-A',
            companyName: '테스트푸드',
            adminName: '홍길동',
            adminEmail: 'admin@test.com',
            status: 'ACTIVE',
            onboardingStatus: 'ACTIVE',
            createdAt: '2026-06-21T10:30:00.000Z',
          },
        ],
      },
    });

    const result = await listPlatformTenants({
      pageIndex: 1,
      pageSize: 10,
      searchField: 'companyName',
      searchKeyword: '',
      status: 'all',
    });

    const first: PlatformTenantManagementItem = result.items[0];
    expect(first.tenantCode).toBe('TENANT-A');
    expect(first.companyName).toBe('테스트푸드');
    expect(result.total).toBe(1);
  });

  it('loads single tenant detail via dedicated endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          tenant: {
            tenantCode: 'TENANT-A',
            companyName: '테스트푸드',
            adminName: '홍길동',
            adminEmail: 'admin@test.com',
            status: 'ACTIVE',
            onboardingStatus: 'EMAIL_SENT',
            createdAt: '2026-06-21T10:30:00.000Z',
          },
        },
      },
    });

    const detail = await getPlatformTenantByCode('TENANT-A');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/tenants/TENANT-A',
    );
    expect(detail?.tenantCode).toBe('TENANT-A');
    expect(detail?.onboardingStatus).toBe('EMAIL_SENT');
  });
});
