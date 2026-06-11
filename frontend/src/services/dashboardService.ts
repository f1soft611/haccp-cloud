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
};

export type TenantCodeIssuanceSummary = {
  totalIssued: number;
  issuedThisMonth: number;
  issuedThisWeek: number;
  recentIssues: Array<{
    tenantCode: string;
    companyName: string;
    issuedAt: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
};

export type PlatformAdminTenantList = {
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
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
  }>;
};

export type PlatformAdminCcpDocuments = {
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
  const { data } = await apiClient.get<PlatformAdminDashboardKpis>(
    '/platform-admin/dashboard/kpis',
  );
  return data;
}

export async function listPlatformAdminTenantCodeIssuance(): Promise<TenantCodeIssuanceSummary> {
  const { data } = await apiClient.get<TenantCodeIssuanceSummary>(
    '/platform-admin/dashboard/tenant-code-issuance',
  );
  return data;
}

export async function listPlatformAdminTenants(): Promise<PlatformAdminTenantList> {
  const { data } = await apiClient.get<PlatformAdminTenantList>(
    '/platform-admin/dashboard/tenants',
  );
  return data;
}

export async function listPlatformAdminCcpDocuments(): Promise<PlatformAdminCcpDocuments> {
  const { data } = await apiClient.get<PlatformAdminCcpDocuments>(
    '/platform-admin/dashboard/ccp-documents',
  );
  return data;
}
