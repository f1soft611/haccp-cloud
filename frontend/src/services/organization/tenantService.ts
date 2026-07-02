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
  planCode: string;
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

export type TenantVerificationResult = {
  tenantCode: string;
  tenantNm: string;
  adminEmail: string;
  loginAccountId: number;
  adminLoginCode: string;
  verified: boolean;
  message: string;
};

export type TenantOnboardingCompleteRequest = {
  tenantCode: string;
  authToken: string;
  password: string;
  phoneNumber?: string;
  loginDomain?: string;
  logoImage?: string;
};

type IssueTenantCodeEnvelope = {
  resultCode?: number | string;
  resultMessage?: string;
  result?: Partial<IssueTenantCodeResponse> & {
    tenantNm?: string;
    companyName?: string;
    company_name?: string;
    businessRegistrationNumber?: string;
    business_registration_number?: string;
    corporateNumber?: string;
    corporate_number?: string;
    adminEmail?: string;
    admin_email?: string;
    createdAt?: string;
    created_at?: string;
    mailDispatchStatus?: MailDispatchStatus | string;
    mail_dispatch_status?: MailDispatchStatus | string;
  };
  resultData?: Partial<IssueTenantCodeResponse> & {
    tenantNm?: string;
    companyName?: string;
    company_name?: string;
    businessRegistrationNumber?: string;
    business_registration_number?: string;
    corporateNumber?: string;
    corporate_number?: string;
    adminEmail?: string;
    admin_email?: string;
    createdAt?: string;
    created_at?: string;
    mailDispatchStatus?: MailDispatchStatus | string;
    mail_dispatch_status?: MailDispatchStatus | string;
  };
  tenantCode?: string;
  companyName?: string;
  company_name?: string;
  businessRegistrationNumber?: string;
  business_registration_number?: string;
  corporateNumber?: string;
  corporate_number?: string;
  adminEmail?: string;
  admin_email?: string;
  createdAt?: string;
  created_at?: string;
  mailDispatchStatus?: MailDispatchStatus | string;
  mail_dispatch_status?: MailDispatchStatus | string;
};

function normalizeIssueTenantCodeResponse(
  data: IssueTenantCodeEnvelope | IssueTenantCodeResponse,
): IssueTenantCodeResponse {
  const payload =
    (data as IssueTenantCodeEnvelope).result ??
    (data as IssueTenantCodeEnvelope).resultData ??
    data;

  const mailDispatchStatus = String(
    payload.mailDispatchStatus ?? payload.mail_dispatch_status ?? '',
  )
    .trim()
    .toUpperCase() as MailDispatchStatus;

  return {
    tenantCode: String(payload.tenantCode ?? payload.tenant_code ?? '').trim(),
    companyName: String(
      payload.companyName ??
        payload.company_name ??
        payload.tenantNm ??
        payload.tenant_nm ??
        '',
    ).trim(),
    businessRegistrationNumber: String(
      payload.businessRegistrationNumber ??
        payload.business_registration_number ??
        '',
    ).trim(),
    adminEmail: String(payload.adminEmail ?? payload.admin_email ?? '').trim(),
    createdAt: String(payload.createdAt ?? payload.created_at ?? '').trim(),
    mailDispatchStatus: mailDispatchStatus || 'FAILED',
  };
}

export async function issueTenantCode(
  payload: IssueTenantCodeRequest,
): Promise<IssueTenantCodeResponse> {
  const { data } = await apiClient.post<IssueTenantCodeEnvelope>(
    '/tenants/issue-code',
    payload,
  );
  return normalizeIssueTenantCodeResponse(data);
}

export async function listSampleTenants(): Promise<SampleTenantItem[]> {
  const { data } = await apiClient.get<SampleTenantItem[]>('/tenants/samples');
  return data;
}

export async function verifyTenantEmail(
  authToken: string,
): Promise<TenantVerificationResult> {
  const { data } = await apiClient.post<{
    code?: string;
    message?: string;
    data?: Partial<TenantVerificationResult>;
  }>('/v1/tenants/onboarding/verify-email', null, {
    params: { authToken },
  });

  const payload = data.data ?? {};

  return {
    tenantCode: String(payload.tenantCode ?? '').trim(),
    tenantNm: String(payload.tenantNm ?? '').trim(),
    adminEmail: String(payload.adminEmail ?? '').trim(),
    loginAccountId: Number(payload.loginAccountId ?? 0),
    adminLoginCode: String(payload.adminLoginCode ?? '').trim(),
    verified: payload.verified === true,
    message: String(payload.message ?? data.message ?? '').trim(),
  };
}

export async function completeTenantOnboarding(
  payload: TenantOnboardingCompleteRequest,
): Promise<void> {
  await apiClient.post('/v1/tenants/onboarding/complete', payload);
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
