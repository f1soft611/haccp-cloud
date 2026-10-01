export const PLATFORM_TENANT_CODE = 'PLATFORM';

export function normalizePlatformTenantCode(value?: string | null): string {
  const normalized = value?.trim().toUpperCase() ?? '';
  return normalized === '000001' || normalized === PLATFORM_TENANT_CODE
    ? PLATFORM_TENANT_CODE
    : normalized;
}
