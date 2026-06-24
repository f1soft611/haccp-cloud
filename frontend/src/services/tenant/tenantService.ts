import { apiClient } from '../api/apiClient';

type TenantByDomainEnvelope = {
  resultCode?: number | string;
  resultMessage?: string;
  result?: {
    tenantId?: number;
    tenantNm?: string;
    logoImage?: string;
    onboardingStatus?: string;
    useAt?: string;
    tenantCode?: string;
  };
  tenantId?: number;
  tenantNm?: string;
  logoImage?: string;
  onboardingStatus?: string;
  useAt?: string;
  tenantCode?: string;
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
  const normalizedDomain = domain.trim();
  if (!normalizedDomain) {
    return null;
  }

  const { data } = await apiClient.get<TenantByDomainEnvelope>(
    `/tenants/${encodeURIComponent(normalizedDomain)}`,
  );

  const resultCode = String(data.resultCode ?? '').trim();
  const payload = data.result ?? data;
  const tenantId = Number(payload.tenantId);

  if ((resultCode && resultCode !== '200') || !Number.isFinite(tenantId)) {
    return null;
  }

  return {
    tenantId,
    tenantNm: payload.tenantNm?.trim() || '',
    logoImage: payload.logoImage,
    onboardingStatus: payload.onboardingStatus,
    useAt: payload.useAt,
    tenantCode: payload.tenantCode,
  };
}
