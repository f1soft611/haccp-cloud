import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/apiClient';
import {
  getDashboardMetrics,
  getPlatformAdminDashboardKpis,
  listPlatformAdminTenantCodeIssuance,
  listPlatformAdminTenants,
  listPlatformAdminCcpDocuments,
} from '../services/dashboardService';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  it('calls platform admin KPI endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        activeTenants: 12,
        newTenantsLast7Days: 3,
        ccpDocCompletionRate: 87,
        tenantsWithoutCcpDocs: 2,
      },
    });

    const result = await getPlatformAdminDashboardKpis();

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/kpis');
    expect(result.activeTenants).toBe(12);
  });

  it('keeps tenant dashboard metrics contract for backward compatibility', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { totalDocuments: 10, draftTemplates: 2, updatedToday: 4 },
    });

    const result = await getDashboardMetrics('TENANT-A');

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', {
      headers: { 'x-tenant-code': 'TENANT-A' },
    });
    expect(result.draftTemplates).toBe(2);
  });

  it('calls tenant code issuance endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        totalIssued: 100,
        issuedThisMonth: 10,
        issuedThisWeek: 3,
        recentIssues: [],
      },
    });

    await listPlatformAdminTenantCodeIssuance();

    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/tenant-code-issuance',
    );
  });

  it('calls tenant list endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        summary: { total: 20, active: 18, inactive: 2 },
        items: [],
      },
    });

    await listPlatformAdminTenants();

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/tenants');
  });

  it('calls ccp documents endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        overall: {
          completionRate: 80,
          completedTenants: 16,
          totalTenants: 20,
        },
        items: [],
      },
    });

    await listPlatformAdminCcpDocuments();

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/dashboard/ccp-documents');
  });
});
