import { apiClient } from './apiClient';
import type { OnboardingStatus, UserRole } from '../shared/store/authStore';

export type LoginRequest = {
  tenantCode: string;
  userId: string;
  password: string;
};

export type LoginResponse = {
  tenantCode: string;
  userId: string;
  role: UserRole;
  accessToken: string;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', request);
  return data;
}
