import { apiClient } from './apiClient';
import type { OnboardingStatus } from '../shared/store/authStore';

export type FirstLoginSetupStatus = {
  tenantCode: string;
  userCount: number;
  departmentCount: number;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

export type FirstSetupCompletionResponse = {
  tenantCode?: string;
  userCount?: number;
  departmentCount?: number;
  completed?: boolean;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

export async function getFirstSetupStatus(
  tenantCode: string,
): Promise<FirstLoginSetupStatus> {
  const { data } = await apiClient.get<FirstLoginSetupStatus>(
    '/first-login-setup/status',
    {
      headers: { 'x-tenant-code': tenantCode },
    },
  );

  return data;
}

export async function completeFirstSetup(
  tenantCode: string,
): Promise<FirstSetupCompletionResponse> {
  const { data } = await apiClient.post<FirstSetupCompletionResponse>(
    '/first-login-setup/complete',
    {},
    {
      headers: { 'x-tenant-code': tenantCode },
    },
  );

  return data;
}
