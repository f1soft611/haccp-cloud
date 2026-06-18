import axios from 'axios';
import { apiClient } from '../api/apiClient';
import type { OnboardingStatus, UserRole } from '../../shared/store/authStore';

export type LoginRequest = {
  tenantCode: string;
  userId: string;
  password: string;
};

export type PlatformAdminLoginRequest = {
  userId: string;
  password: string;
};

export type LoginResponse = {
  tenantCode: string;
  userId: string;
  role: UserRole;
  accessToken: string;
  refreshToken?: string;
  loginHistoryId?: number;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

type BackendLoginVO = {
  factoryCode?: string;
  id?: string;
  groupNm?: string;
};

type BackendLoginEnvelope = {
  resultVO?: BackendLoginVO;
  jToken?: string;
  refreshToken?: string;
  loginHistoryId?: number;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

function resolveAuthUrl(path: string): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return path;
  }

  const trimmedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

  try {
    return new URL(path, `${trimmedBaseUrl}/`).toString();
  } catch {
    return path;
  }
}

async function postAuth<T>(path: string, body: unknown) {
  if (import.meta.env.MODE === 'test' || !import.meta.env.VITE_API_BASE_URL) {
    return apiClient.post<T>(path, body);
  }

  return axios.post<T>(resolveAuthUrl(path), body);
}

function resolveRole(userId: string, groupNm?: string): UserRole {
  const normalizedGroup = (groupNm ?? '').trim().toUpperCase();

  if (
    normalizedGroup === 'ROLE_ADMIN' ||
    normalizedGroup === 'PLATFORM_ADMIN'
  ) {
    return 'PLATFORM_ADMIN';
  }

  if (
    normalizedGroup === 'TENANT_ADMIN' ||
    normalizedGroup === 'ROLE_TENANT_ADMIN'
  ) {
    return 'TENANT_ADMIN';
  }

  if (
    normalizedGroup === 'TENANT_USER' ||
    normalizedGroup === 'ROLE_USER' ||
    normalizedGroup === 'USER'
  ) {
    return 'USER';
  }

  if (userId.trim().toLowerCase().includes('admin')) {
    return 'TENANT_ADMIN';
  }

  return 'USER';
}

function normalizeLoginResponse(
  data: LoginResponse | BackendLoginEnvelope,
): LoginResponse {
  if ('accessToken' in data && 'tenantCode' in data && 'userId' in data) {
    return data;
  }

  const resultVO = data.resultVO ?? {};
  const userId = resultVO.id ?? '';

  return {
    tenantCode: resultVO.factoryCode ?? '000001',
    userId,
    role: resolveRole(userId, resultVO.groupNm),
    accessToken: data.jToken ?? '',
    refreshToken: data.refreshToken,
    loginHistoryId: data.loginHistoryId,
    onboardingRequired: data.onboardingRequired ?? false,
    onboardingStatus: data.onboardingStatus ?? 'COMPLETED',
  };
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await postAuth<LoginResponse | BackendLoginEnvelope>(
    '/auth/login-jwt',
    {
      id: request.userId,
      password: request.password,
      factoryCode: request.tenantCode,
      tenantCode: request.tenantCode,
    },
  );

  const normalized = normalizeLoginResponse(data);
  return {
    ...normalized,
    tenantCode: request.tenantCode,
  };
}

export async function loginPlatformAdmin(
  request: PlatformAdminLoginRequest,
): Promise<LoginResponse> {
  const { data } = await postAuth<LoginResponse | BackendLoginEnvelope>(
    '/auth/login-jwt/admin',
    {
      id: request.userId,
      password: request.password,
    },
  );

  const normalized = normalizeLoginResponse(data);

  if (normalized.role !== 'PLATFORM_ADMIN') {
    throw new Error('플랫폼 관리자 계정만 로그인할 수 있습니다.');
  }

  return normalized;
}
