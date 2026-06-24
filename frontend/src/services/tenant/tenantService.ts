import { apiClient } from '../api/apiClient';

const DOMAIN_PATTERN =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function normalizeTenantDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || !DOMAIN_PATTERN.test(normalized)) {
    return '';
  }

  return normalized;
}

type TenantByDomainEnvelope = {
  resultCode?: number | string;
  result_code?: number | string;
  resultMessage?: string;
  resultData?: {
    tenantId?: number;
    tenant_id?: number;
    tenantNm?: string;
    tenant_nm?: string;
    companyName?: string;
    company_name?: string;
    logoImage?: string;
    logo_image?: string;
    onboardingStatus?: string;
    onboarding_status?: string;
    useAt?: string;
    use_at?: string;
    tenantCode?: string;
    tenant_code?: string;
  };
  result?: {
    tenantId?: number;
    tenant_id?: number;
    tenantNm?: string;
    tenant_nm?: string;
    companyName?: string;
    company_name?: string;
    logoImage?: string;
    logo_image?: string;
    onboardingStatus?: string;
    onboarding_status?: string;
    useAt?: string;
    use_at?: string;
    tenantCode?: string;
    tenant_code?: string;
  };
  tenantId?: number;
  tenant_id?: number;
  tenantNm?: string;
  tenant_nm?: string;
  companyName?: string;
  company_name?: string;
  logoImage?: string;
  logo_image?: string;
  onboardingStatus?: string;
  onboarding_status?: string;
  useAt?: string;
  use_at?: string;
  tenantCode?: string;
  tenant_code?: string;
};

export type IssueTenantCodeRequest = {
  companyName: string;
  businessRegistrationNumber: string;
  corporateNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  address: string;
  phoneNumber: string;
  registrationDate: string;
  adminName: string;
  adminEmail: string;
};

export type MailDispatchStatus = 'MOCK_SENT' | 'QUEUED' | 'SENT' | 'FAILED';

export type IssueTenantCodeResponse = {
  tenantCode: string;
  companyName: string;
  businessRegistrationNumber: string;
  adminEmail: string;
  createdAt: string;
  mailDispatchStatus: MailDispatchStatus;
};

export type SampleTenantItem = {
  tenantCode: string;
  companyName: string;
  businessRegistrationNumber?: string;
  adminEmail: string;
  issuedAt: string;
};

export type TenantDomainInfo = {
  tenantId: number;
  tenantNm: string;
  logoImage?: string;
  onboardingStatus?: string;
  useAt?: string;
  tenantCode?: string;
};

export async function issueTenantCode(
  payload: IssueTenantCodeRequest,
): Promise<IssueTenantCodeResponse> {
  const { data } = await apiClient.post<IssueTenantCodeResponse>(
    '/tenants/issue-code',
    payload,
  );
  return data;
}

export async function listSampleTenants(): Promise<SampleTenantItem[]> {
  const { data } = await apiClient.get<SampleTenantItem[]>('/tenants/samples');
  return data;
}

export async function getTenantByDomain(
  domain: string,
): Promise<TenantDomainInfo | null> {
  const normalizedDomain = normalizeTenantDomain(domain);
  if (!normalizedDomain) {
    return null;
  }

  const { data } = await apiClient.get<TenantByDomainEnvelope>(
    `/tenants/${encodeURIComponent(normalizedDomain)}`,
  );

  const resultCode = String(data.resultCode ?? data.result_code ?? '').trim();
  const payload = (data.result ?? data.resultData ?? data) as Record<
    string,
    unknown
  >;

  const tenantId = Number(
    payload.tenantId ?? payload.tenant_id ?? data.tenantId ?? data.tenant_id,
  );

  const normalizedCode = resultCode.toUpperCase();
  const isKnownSuccessCode =
    normalizedCode === '' ||
    normalizedCode === '200' ||
    normalizedCode === 'SUCCESS' ||
    normalizedCode === 'OK';

  if (!isKnownSuccessCode && !Number.isFinite(tenantId)) {
    return null;
  }

  if (!Number.isFinite(tenantId)) {
    return null;
  }

  return {
    tenantId,
    tenantNm: String(
      payload.tenantNm ??
        payload.tenant_nm ??
        payload.companyName ??
        payload.company_name ??
        data.tenantNm ??
        data.tenant_nm ??
        data.companyName ??
        data.company_name ??
        '',
    ).trim(),
    logoImage:
      String(
        payload.logoImage ??
          payload.logo_image ??
          data.logoImage ??
          data.logo_image ??
          '',
      ).trim() || undefined,
    onboardingStatus:
      String(
        payload.onboardingStatus ??
          payload.onboarding_status ??
          data.onboardingStatus ??
          data.onboarding_status ??
          '',
      ).trim() || undefined,
    useAt:
      String(
        payload.useAt ?? payload.use_at ?? data.useAt ?? data.use_at ?? '',
      ).trim() || undefined,
    tenantCode:
      String(
        payload.tenantCode ??
          payload.tenant_code ??
          data.tenantCode ??
          data.tenant_code ??
          '',
      ).trim() || undefined,
  };
}
