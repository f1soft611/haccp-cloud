import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/apiClient';
import {
  getDashboardMetrics,
  getPlatformAdminDashboardKpis,
  listPlatformAdminTenantCodeIssuanceSummary,
  listPlatformAdminTenantCodeIssuance,
  listPlatformAdminTenants,
  listPlatformAdminCcpDocuments,
  type DashboardMetrics,
  type PlatformAdminDashboardKpis,
  type PlatformAdminCcpDocuments,
  type PlatformAdminTenantList,
  type TenantCodeIssuanceSummary,
} from '../services/dashboardService';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('calls platform admin KPI endpoint', async () => {
    const kpiPayload: PlatformAdminDashboardKpis = {
      activeTenants: 12,
      newTenantsLast7Days: 3,
      ccpDocCompletionRate: 87,
      tenantsWithoutCcpDocs: 2,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: kpiPayload });

    const result = await getPlatformAdminDashboardKpis();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/kpis',
    );
    expect(result.activeTenants).toBe(12);
  });

  it('keeps tenant dashboard metrics contract for backward compatibility', async () => {
    const metricsPayload: DashboardMetrics = {
      totalDocuments: 10,
      draftTemplates: 2,
      updatedToday: 4,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: metricsPayload });

    const result = await getDashboardMetrics('TENANT-A');

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', {
      headers: { 'x-tenant-code': 'TENANT-A' },
    });
    expect(result.draftTemplates).toBe(2);
  });

  it('calls tenant code issuance endpoint', async () => {
    const issuancePayload: TenantCodeIssuanceSummary = {
      totalIssued: 100,
      issuedThisMonth: 10,
      issuedThisWeek: 3,
      recentIssues: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: issuancePayload });

    await listPlatformAdminTenantCodeIssuance();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/tenant-code-issuance',
    );
  });

  it('supports the clearer tenant code issuance summary name', async () => {
    const issuancePayload: TenantCodeIssuanceSummary = {
      totalIssued: 101,
      issuedThisMonth: 11,
      issuedThisWeek: 4,
      recentIssues: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: issuancePayload });

    const result = await listPlatformAdminTenantCodeIssuanceSummary();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/tenant-code-issuance',
    );
    expect(result.totalIssued).toBe(101);
  });

  it('calls tenant list endpoint', async () => {
    const tenantListPayload: PlatformAdminTenantList = {
      summary: { total: 20, active: 18, inactive: 2 },
      items: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: tenantListPayload });

    await listPlatformAdminTenants();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/tenants',
    );
  });

  it('calls ccp documents endpoint', async () => {
    const ccpDocumentsPayload: PlatformAdminCcpDocuments = {
      overall: {
        completionRate: 80,
        completedTenants: 16,
        totalTenants: 20,
      },
      items: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: ccpDocumentsPayload,
    });

    await listPlatformAdminCcpDocuments();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/ccp-documents',
    );
  });

  it.each([
    [
      'KPI',
      () => getPlatformAdminDashboardKpis(),
      '/platform-admin/dashboard/kpis',
      { hasError: true, activeTenants: 0 },
    ],
    [
      'tenant code issuance summary',
      () => listPlatformAdminTenantCodeIssuanceSummary(),
      '/platform-admin/dashboard/tenant-code-issuance',
      { hasError: true, totalIssued: 0 },
    ],
    [
      'tenant list',
      () => listPlatformAdminTenants(),
      '/platform-admin/dashboard/tenants',
      { hasError: true, items: [] },
    ],
    [
      'CCP documents',
      () => listPlatformAdminCcpDocuments(),
      '/platform-admin/dashboard/ccp-documents',
      { hasError: true, items: [] },
    ],
  ])(
    'returns safe fallback data for platform admin %s API errors',
    async (_label, request, endpoint, expectedPartial) => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network failure'));

      const result = await request();

      expect(result).toMatchObject(expectedPartial);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(endpoint);
    },
  );
});
