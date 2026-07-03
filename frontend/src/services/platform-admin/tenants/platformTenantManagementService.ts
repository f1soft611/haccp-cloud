import { apiClient } from '../../api/apiClient';

export type PlatformTenantStatus = 'ACTIVE' | 'INACTIVE';
export type PlatformTenantOnboardingStatus =
  | 'EMAIL_QUEUED'
  | 'EMAIL_SENT'
  | 'EMAIL_VERIFIED'
  | 'FIRST_SETUP_COMPLETED'
  | 'ACTIVE';

export type PlatformTenantManagementItem = {
  tenantId?: number;
  tenantCode: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
  status: PlatformTenantStatus;
  onboardingStatus: PlatformTenantOnboardingStatus;
  planCode?: string;
  planName?: string;
  corporateNumber?: string;
  businessType?: string;
  businessCategory?: string;
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

type ResultEnvelope<T> = {
  result?: {
    data?: T;
  };
};

type TenantDetailEnvelope = {
  result?: {
    tenant?: PlatformTenantManagementItem;
  };
  resultData?: {
    tenant?: PlatformTenantManagementItem;
  };
  tenant?: PlatformTenantManagementItem;
};

function normalizeTenantDetail(
  data: TenantDetailEnvelope | ResultEnvelope<TenantDetailEnvelope>,
): PlatformTenantManagementItem | null {
  const payload = ((data as ResultEnvelope<TenantDetailEnvelope>)?.result
    ?.data ?? data) as TenantDetailEnvelope;
  const item =
    payload.result?.tenant ?? payload.resultData?.tenant ?? payload.tenant;
  return item ?? null;
}

export async function listPlatformTenants(
  params: ListPlatformTenantsParams,
): Promise<ListPlatformTenantsResult> {
  const backendPageIndex = Math.max(0, params.pageIndex - 1);

  const { data } = await apiClient.get<
    DashboardTenantEnvelope | ResultEnvelope<DashboardTenantEnvelope>
  >('/v1/platform-admin/dashboard/tenants', {
    params: {
      pageIndex: backendPageIndex,
      pageSize: params.pageSize,
      searchField: params.searchField,
      searchKeyword: params.searchKeyword,
      status: params.status === 'all' ? undefined : params.status,
      onboardingStatus:
        params.onboardingStatus === 'all' ? undefined : params.onboardingStatus,
    },
  });

  const payload = ((data as ResultEnvelope<DashboardTenantEnvelope>)?.result
    ?.data ?? data) as DashboardTenantEnvelope;

  return {
    items: payload.items ?? [],
    total: payload.summary?.total ?? 0,
    active: payload.summary?.active ?? 0,
    inactive: payload.summary?.inactive ?? 0,
  };
}

export async function getPlatformTenantByCode(
  tenantCode: string,
): Promise<PlatformTenantManagementItem | null> {
  const normalized = tenantCode.trim();
  if (!normalized) {
    return null;
  }

  const { data } = await apiClient.get<
    TenantDetailEnvelope | ResultEnvelope<TenantDetailEnvelope>
  >(`/v1/platform-admin/tenants/${encodeURIComponent(normalized)}`);

  return normalizeTenantDetail(data);
}

export async function dispatchTenantVerificationEmail(
  tenantCode: string,
): Promise<void> {
  const normalizedTenantCode = tenantCode.trim();
  await apiClient.post(
    `/v1/platform-admin/tenants/${encodeURIComponent(normalizedTenantCode)}/onboarding/verification-emails`,
    {},
  );
}

export async function resendTenantVerificationEmail(
  tenantCode: string,
): Promise<void> {
  const normalizedTenantCode = tenantCode.trim();
  await apiClient.post(
    `/v1/platform-admin/tenants/${encodeURIComponent(normalizedTenantCode)}/onboarding/verification-emails`,
    {},
  );
}
