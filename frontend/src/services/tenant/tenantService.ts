import { apiClient } from '../api/apiClient';

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
