import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  issueTenantCode,
  listSampleTenants,
  verifyTenantEmail,
  completeTenantOnboarding,
} from '../services/organization/tenantService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('tenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issues tenant code via v1 platform-admin endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        result: {
          tenantCode: 'TENANT_000001',
          companyName: '테스트푸드',
          businessRegistrationNumber: '123-45-67890',
          adminEmail: 'admin@test.com',
          createdAt: '2026-07-03T00:00:00',
          mailDispatchStatus: 'SENT',
        },
      },
    });

    const issued = await issueTenantCode({
      companyName: '테스트푸드',
      planCode: 'BASIC',
      businessRegistrationNumber: '123-45-67890',
      corporateNumber: '1101111234567',
      representativeName: '홍길동',
      businessType: '식품',
      businessCategory: '제조',
      address: '서울',
      phoneNumber: '010-0000-0000',
      registrationDate: '2026-07-03',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/platform-admin/tenants/issue-code',
      expect.any(Object),
    );
    expect(issued.tenantCode).toBe('TENANT_000001');
  });

  it('reads sample tenants from result.items envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          items: [
            {
              tenantCode: 'TENANT-A',
              companyName: '샘플',
              adminEmail: 'a@test.com',
              issuedAt: '2026-07-01',
            },
          ],
        },
      },
    });

    const items = await listSampleTenants();

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/platform-admin/tenants/samples',
    );
    expect(items).toHaveLength(1);
    expect(items[0].tenantCode).toBe('TENANT-A');
  });

  it('verifies email with tenant-scoped endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        result: {
          tenantCode: 'TENANT-A',
          message: '이메일 인증이 완료되었습니다',
          verification: {
            tenantCode: 'TENANT-A',
            tenantNm: '테스트푸드',
            adminEmail: 'admin@test.com',
            loginAccountId: 10,
            adminLoginCode: 'tenant.admin',
            verified: true,
          },
        },
      },
    });

    const verified = await verifyTenantEmail('TENANT-A', 'token-1');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/platform-admin/tenants/TENANT-A/onboarding/verifications',
      {
        authToken: 'token-1',
      },
    );
    expect(verified.verified).toBe(true);
  });

  it('completes onboarding with tenant-scoped endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

    await completeTenantOnboarding({
      tenantCode: 'TENANT-A',
      authToken: 'token-1',
      password: 'password123',
      phoneNumber: '010-1111-2222',
      loginDomain: 'tenant-a.com',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/platform-admin/tenants/TENANT-A/onboarding/completions',
      {
        authToken: 'token-1',
        password: 'password123',
        phoneNumber: '010-1111-2222',
        loginDomain: 'tenant-a.com',
        logoImage: undefined,
      },
    );
  });
});
