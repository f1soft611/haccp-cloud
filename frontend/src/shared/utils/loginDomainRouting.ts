// 기존 -> 마지막 로그인 "도메인"을 저장하고 /login/{도메인} 경로를 만들었음
// 변경 -> 마지막 로그인 "업체번호(6자리)"를 저장하고 /login/{업체번호} 경로를 만듦.
//         예전 키(haccp.last-login-domain)는 읽지 않음
const LAST_LOGIN_TENANT_NO_STORAGE_KEY = 'haccp.last-login-tenant-no';

const TENANT_NO_PATTERN = /^[1-9][0-9]{5}$/;

export function normalizeTenantNo(value: string): string {
  const trimmed = (value ?? '').trim();
  return TENANT_NO_PATTERN.test(trimmed) ? trimmed : '';
}

export function loadLastLoginTenantNo(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return normalizeTenantNo(
      window.localStorage.getItem(LAST_LOGIN_TENANT_NO_STORAGE_KEY) ?? '',
  );
}

export function persistLastLoginTenantNo(tenantNo: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeTenantNo(tenantNo);
  if (!normalized) {
    return;
  }

  window.localStorage.setItem(LAST_LOGIN_TENANT_NO_STORAGE_KEY, normalized);
}

export function resolveLoginPathWithLastTenantNo(): string {
  const tenantNo = loadLastLoginTenantNo();
  return tenantNo ? `/login/${tenantNo}` : '/login';
}