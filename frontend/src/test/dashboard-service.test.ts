import { describe, expect, it, vi } from 'vitest';
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
  it('calls platform admin KPI endpoint', async () => {
    const kpiPayload: PlatformAdminDashboardKpis = {
      activeTenants: 12,
      newTenantsLast7Days: 3,
      ccpDocCompletionRate: 87,
      tenantsWithoutCcpDocs: 2,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: kpiPayload });

    const result = await getPlatformAdminDashboardKpis();

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/kpis');
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

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/tenants');
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
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: ccpDocumentsPayload });

    await listPlatformAdminCcpDocuments();

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/ccp-documents');
  });

  it.each([
    [
      'KPI',
      () => getPlatformAdminDashboardKpis(),
      '/platform-admin/dashboard/kpis',
    ],
    [
      'tenant code issuance summary',
      () => listPlatformAdminTenantCodeIssuanceSummary(),
      '/platform-admin/dashboard/tenant-code-issuance',
    ],
    [
      'tenant list',
      () => listPlatformAdminTenants(),
      '/platform-admin/dashboard/tenants',
    ],
    [
      'CCP documents',
      () => listPlatformAdminCcpDocuments(),
      '/platform-admin/dashboard/ccp-documents',
    ],
  ])(
    'propagates API errors for platform admin %s requests',
    async (_label, request, endpoint) => {
      const expectedError = new Error('network failure');
      vi.mocked(apiClient.get).mockRejectedValueOnce(expectedError);

      await expect(request()).rejects.toBe(expectedError);
      expect(apiClient.get).toHaveBeenCalledWith(endpoint);
    },
  );
});
