import { apiClient } from './apiClient';

export type TenantOnboardRequest = {
  tenantCode: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
};

export async function onboardTenant(payload: TenantOnboardRequest) {
  const { data } = await apiClient.post('/tenants', payload);
  return data as { tenantCode: string; companyName: string; createdAt: string };
}
