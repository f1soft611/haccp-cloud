import { apiClient } from './apiClient';

export type DashboardMetrics = {
  totalDocuments: number;
  draftTemplates: number;
  updatedToday: number;
};

export type PlatformAdminDashboardKpis = {
  activeTenants: number;
  newTenantsLast7Days: number;
  ccpDocCompletionRate: number;
  tenantsWithoutCcpDocs: number;
  hasError?: boolean;
};

export type TenantActivationStatus = 'ACTIVE' | 'INACTIVE';

export type TenantCodeIssuanceSummary = {
  totalIssued: number;
  issuedThisMonth: number;
  issuedThisWeek: number;
  hasError?: boolean;
  recentIssues: Array<{
    tenantCode: string;
    companyName: string;
    issuedAt: string;
    status: TenantActivationStatus;
  }>;
};

export type PlatformAdminTenantList = {
  hasError?: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
  items: Array<{
    tenantCode: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    status: TenantActivationStatus;
    createdAt: string;
  }>;
};

export type PlatformAdminCcpDocuments = {
  hasError?: boolean;
  overall: {
    completionRate: number;
    completedTenants: number;
    totalTenants: number;
  };
  items: Array<{
    tenantCode: string;
    companyName: string;
    generatedCount: number;
    requiredCount: number;
    completionRate: number;
    updatedAt: string;
  }>;
};

export async function getDashboardMetrics(
  tenantCode: string,
): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetrics>('/dashboard', {
    headers: { 'x-tenant-code': tenantCode },
  });
  return data;
}

export async function getPlatformAdminDashboardKpis(): Promise<PlatformAdminDashboardKpis> {
  try {
    const { data } = await apiClient.get<PlatformAdminDashboardKpis>(
      '/platform-admin/dashboard/kpis',
    );
    return data;
  } catch {
    return {
      activeTenants: 0,
      newTenantsLast7Days: 0,
      ccpDocCompletionRate: 0,
      tenantsWithoutCcpDocs: 0,
      hasError: true,
    };
  }
}

export async function listPlatformAdminTenantCodeIssuanceSummary(): Promise<TenantCodeIssuanceSummary> {
  try {
    const { data } = await apiClient.get<TenantCodeIssuanceSummary>(
      '/platform-admin/dashboard/tenant-code-issuance',
    );
    return data;
  } catch {
    return {
      totalIssued: 0,
      issuedThisMonth: 0,
      issuedThisWeek: 0,
      hasError: true,
      recentIssues: [],
    };
  }
}

export const listPlatformAdminTenantCodeIssuance =
  listPlatformAdminTenantCodeIssuanceSummary;

export async function listPlatformAdminTenants(): Promise<PlatformAdminTenantList> {
  try {
    const { data } = await apiClient.get<PlatformAdminTenantList>(
      '/platform-admin/dashboard/tenants',
    );
    return data;
  } catch {
    return {
      hasError: true,
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      items: [],
    };
  }
}

export async function listPlatformAdminCcpDocuments(): Promise<PlatformAdminCcpDocuments> {
  try {
    const { data } = await apiClient.get<PlatformAdminCcpDocuments>(
      '/platform-admin/dashboard/ccp-documents',
    );
    return data;
  } catch {
    return {
      hasError: true,
      overall: {
        completionRate: 0,
        completedTenants: 0,
        totalTenants: 0,
      },
      items: [],
    };
  }
}
