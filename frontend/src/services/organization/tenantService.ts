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
  registrationDate?: string;
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

type IssueTenantCodePayload = Partial<IssueTenantCodeResponse> & {
  tenantCode?: string;
  tenant_code?: string;
  tenantNm?: string;
  tenant_nm?: string;
  companyName?: string;
  company_name?: string;
  businessRegistrationNumber?: string;
  business_registration_number?: string;
  corporateNumber?: string;
  corporate_number?: string;
  adminEmail?: string;
  admin_email?: string;
  registrationDate?: string;
  registration_date?: string;
  createdAt?: string;
  created_at?: string;
  mailDispatchStatus?: MailDispatchStatus | string;
  mail_dispatch_status?: MailDispatchStatus | string;
};

type IssueTenantCodeEnvelope = {
  resultCode?: number | string;
  resultMessage?: string;
  result?: IssueTenantCodePayload;
  resultData?: IssueTenantCodePayload;
  tenantCode?: string;
  companyName?: string;
  company_name?: string;
  businessRegistrationNumber?: string;
  business_registration_number?: string;
  corporateNumber?: string;
  corporate_number?: string;
  adminEmail?: string;
  admin_email?: string;
  registrationDate?: string;
  registration_date?: string;
  createdAt?: string;
  created_at?: string;
  mailDispatchStatus?: MailDispatchStatus | string;
  mail_dispatch_status?: MailDispatchStatus | string;
};

type ResultEnvelope<T> = {
  resultCode?: number | string;
  resultMessage?: string;
  result?: T;
  resultData?: T;
};

type TenantVerificationPayload = {
  tenantCode?: string;
  verification?: Partial<TenantVerificationResult>;
  message?: string;
};

function unwrapResult<T>(payload: T | ResultEnvelope<T>): T {
  const envelope = payload as ResultEnvelope<T>;
  const resultCode = String(envelope?.resultCode ?? '').trim();
  const numericResultCode = Number(resultCode);
  if (
    resultCode &&
    Number.isFinite(numericResultCode) &&
    numericResultCode !== 200
  ) {
    const errorPayload = envelope.result ?? envelope.resultData ?? payload;
    throw {
      response: {
        data: errorPayload,
      },
      message:
        (envelope?.resultMessage ?? '') || '요청 처리 중 오류가 발생했습니다.',
    };
  }

  return (envelope?.result ?? envelope?.resultData ?? payload) as T;
}

function normalizeIssueTenantCodeResponse(
  data: IssueTenantCodeEnvelope | IssueTenantCodeResponse,
): IssueTenantCodeResponse {
  const payload: IssueTenantCodePayload =
    (data as IssueTenantCodeEnvelope).result ??
    (data as IssueTenantCodeEnvelope).resultData ??
    (data as IssueTenantCodePayload);

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
    registrationDate:
      String(
        payload.registrationDate ?? payload.registration_date ?? '',
      ).trim() || undefined,
    createdAt: String(payload.createdAt ?? payload.created_at ?? '').trim(),
    mailDispatchStatus: mailDispatchStatus || 'FAILED',
  };
}

export async function issueTenantCode(
  payload: IssueTenantCodeRequest,
): Promise<IssueTenantCodeResponse> {
  const { data } = await apiClient.post<
    IssueTenantCodeEnvelope | ResultEnvelope<IssueTenantCodeEnvelope>
  >('/v1/platform-admin/tenants/issue-code', payload);
  return normalizeIssueTenantCodeResponse(unwrapResult(data));
}

export async function listSampleTenants(): Promise<SampleTenantItem[]> {
  const { data } = await apiClient.get<
    SampleTenantItem[] | ResultEnvelope<{ items?: SampleTenantItem[] }>
  >('/v1/platform-admin/tenants/samples');
  const unwrapped = unwrapResult<
    { items?: SampleTenantItem[] } | SampleTenantItem[]
  >(data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  return unwrapped.items ?? [];
}

export async function verifyTenantEmail(
  tenantCode: string,
  authToken: string,
): Promise<TenantVerificationResult> {
  const normalizedTenantCode = String(tenantCode ?? '').trim();
  const { data } = await apiClient.post<
    TenantVerificationPayload | ResultEnvelope<TenantVerificationPayload>
  >(
    `/v1/platform-admin/tenants/${encodeURIComponent(normalizedTenantCode)}/onboarding/verifications`,
    {
      authToken,
    },
  );

  const payload = unwrapResult(data);
  const verification = payload.verification ?? {};

  return {
    tenantCode: String(
      payload.tenantCode ?? verification.tenantCode ?? '',
    ).trim(),
    tenantNm: String(verification.tenantNm ?? '').trim(),
    adminEmail: String(verification.adminEmail ?? '').trim(),
    loginAccountId: Number(verification.loginAccountId ?? 0),
    adminLoginCode: String(verification.adminLoginCode ?? '').trim(),
    verified: verification.verified === true,
    message: String(payload.message ?? verification.message ?? '').trim(),
  };
}

export async function verifyTenantEmailByToken(
  authToken: string,
): Promise<TenantVerificationResult> {
  const { data } = await apiClient.post<
    TenantVerificationPayload | ResultEnvelope<TenantVerificationPayload>
  >('/v1/platform-admin/tenants/onboarding/verifications', {
    authToken,
  });

  const payload = unwrapResult(data);
  const verification = payload.verification ?? {};

  return {
    tenantCode: String(
      payload.tenantCode ?? verification.tenantCode ?? '',
    ).trim(),
    tenantNm: String(verification.tenantNm ?? '').trim(),
    adminEmail: String(verification.adminEmail ?? '').trim(),
    loginAccountId: Number(verification.loginAccountId ?? 0),
    adminLoginCode: String(verification.adminLoginCode ?? '').trim(),
    verified: verification.verified === true,
    message: String(payload.message ?? verification.message ?? '').trim(),
  };
}

export async function completeTenantOnboarding(
  payload: TenantOnboardingCompleteRequest,
): Promise<void> {
  const normalizedTenantCode = payload.tenantCode.trim();
  const { data } = await apiClient.post<
    Record<string, unknown> | ResultEnvelope<Record<string, unknown>>
  >(
    `/v1/platform-admin/tenants/${encodeURIComponent(normalizedTenantCode)}/onboarding/completions`,
    {
      authToken: payload.authToken,
      password: payload.password,
      phoneNumber: payload.phoneNumber,
      loginDomain: payload.loginDomain,
      logoImage: payload.logoImage,
    },
  );

  unwrapResult(data);
}

export async function getTenantByDomain(
  domain: string,
): Promise<TenantDomainInfo | null> {
  const normalizedDomain = normalizeTenantDomain(domain);
  if (!normalizedDomain) {
    return null;
  }

  const { data } = await apiClient.get<TenantByDomainEnvelope>(
    `/v1/platform-admin/tenants/domains/${encodeURIComponent(normalizedDomain)}`,
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
