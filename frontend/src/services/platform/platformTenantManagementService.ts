import { apiClient } from '../api/apiClient';

export type PlatformTenantStatus = 'ACTIVE' | 'INACTIVE';
export type PlatformTenantOnboardingStatus =
  | 'EMAIL_QUEUED'
  | 'EMAIL_SENT'
  | 'EMAIL_VERIFIED'
  | 'FIRST_SETUP_COMPLETED'
  | 'ACTIVE';

export type PlatformTenantManagementItem = {
  tenantCode: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
  status: PlatformTenantStatus;
  onboardingStatus: PlatformTenantOnboardingStatus;
  createdAt: string;
};

export type ListPlatformTenantsParams = {
  pageIndex: number;
  pageSize: number;
  searchField?: 'tenantCode' | 'companyName' | 'adminName';
  searchKeyword?: string;
  status?: 'all' | 'ACTIVE' | 'INACTIVE';
  onboardingStatus?:
    | 'all'
    | 'EMAIL_QUEUED'
    | 'EMAIL_SENT'
    | 'EMAIL_VERIFIED'
    | 'FIRST_SETUP_COMPLETED'
    | 'ACTIVE';
};

export type ListPlatformTenantsResult = {
  items: PlatformTenantManagementItem[];
  total: number;
  active: number;
  inactive: number;
};

type DashboardTenantEnvelope = {
  summary?: {
    total?: number;
    active?: number;
    inactive?: number;
  };
  items?: PlatformTenantManagementItem[];
};

export async function listPlatformTenants(
  params: ListPlatformTenantsParams,
): Promise<ListPlatformTenantsResult> {
  const backendPageIndex = Math.max(0, params.pageIndex - 1);

  const { data } = await apiClient.get<DashboardTenantEnvelope>(
    '/platform-admin/dashboard/tenants',
    {
      params: {
        pageIndex: backendPageIndex,
        pageSize: params.pageSize,
        searchField: params.searchField,
        searchKeyword: params.searchKeyword,
        status: params.status === 'all' ? undefined : params.status,
        onboardingStatus:
          params.onboardingStatus === 'all'
            ? undefined
            : params.onboardingStatus,
      },
    },
  );

  return {
    items: data.items ?? [],
    total: data.summary?.total ?? 0,
    active: data.summary?.active ?? 0,
    inactive: data.summary?.inactive ?? 0,
  };
}
