import axios from 'axios';
import { apiClient } from '../api/apiClient';
import type { OnboardingStatus, UserRole } from '../../shared/store/authStore';
import { normalizePlatformTenantCode } from '../../shared/tenant/platformTenant';

export type LoginRequest = {
  userId: string;
  password: string;
  tenantCode?: string;
};

export type PlatformAdminLoginRequest = {
  userId: string;
  password: string;
};

export type LoginResponse = {
  tenantCode: string;
  userId: string;
  displayName?: string;
  email?: string;
  departmentName?: string;
  profileImage?: string;
  signatureImage?: string;
  stampImage?: string;
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
  name?: string;
  email?: string;
  departmentName?: string;
  profileImage?: string;
  signatureImage?: string;
  stampImage?: string;
  groupNm?: string;
  roleCode?: string;
};

type BackendLoginEnvelope = {
  resultCode?: string;
  message?: string;
  resultMessage?: string;
  resultVO?: BackendLoginVO;
  jToken?: string;
  refreshToken?: string;
  loginHistoryId?: number;
  onboardingRequired?: boolean;
  onboardingStatus?: OnboardingStatus;
};

function resolveBackendLoginErrorMessage(
  data: LoginResponse | BackendLoginEnvelope,
): string | null {
  if ('accessToken' in data) {
    return null;
  }

  const resultCode = data.resultCode?.trim().toUpperCase();
  const isSuccessCode = resultCode === '200' || resultCode === 'SUCCESS';
  const backendMessage = data.resultMessage?.trim() || data.message?.trim();

  if (resultCode && !isSuccessCode) {
    return backendMessage || '로그인에 실패했습니다.';
  }

  if (!data.jToken) {
    return backendMessage || '로그인에 실패했습니다.';
  }

  return null;
}

function resolveBrowserSafeBaseUrl(baseUrl: string): string {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return baseUrl;
  }

  if (window.location.protocol !== 'https:' || !baseUrl.startsWith('http://')) {
    return baseUrl;
  }

  try {
    const pathname = new URL(baseUrl).pathname.replace(/\/+$/, '');
    return pathname || '/';
  } catch {
    return baseUrl;
  }
}

function joinPath(baseUrl: string, normalizedPath: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  if (!normalizedBase) {
    return `/${normalizedPath}`;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

export function resolveAuthUrl(path: string): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return path;
  }

  const trimmedBaseUrl = resolveBrowserSafeBaseUrl(
    configuredBaseUrl.replace(/\/+$/, ''),
  );
  const normalizedPath = path.replace(/^\/+/, '');

  if (trimmedBaseUrl.startsWith('/')) {
    return joinPath(trimmedBaseUrl, normalizedPath);
  }

  try {
    return new URL(normalizedPath, `${trimmedBaseUrl}/`).toString();
  } catch {
    return joinPath(trimmedBaseUrl, normalizedPath);
  }
}

async function postAuth<T>(path: string, body: unknown) {
  if (import.meta.env.MODE === 'test' || !import.meta.env.VITE_API_BASE_URL) {
    return apiClient.post<T>(path, body);
  }

  return axios.post<T>(resolveAuthUrl(path), body);
}

function resolveRole(
  userId: string,
  groupNm?: string,
  roleCode?: string,
): UserRole {
  const normalizedRoleCode = (roleCode ?? '').trim().toUpperCase();
  const normalizedGroup = (groupNm ?? '').trim().toUpperCase();

  if (normalizedRoleCode === 'PLATFORM_ADMIN') {
    return 'PLATFORM_ADMIN';
  }

  if (normalizedRoleCode === 'TENANT_ADMIN') {
    return 'TENANT_ADMIN';
  }

  if (normalizedRoleCode === 'TENANT_USER') {
    return 'USER';
  }

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
    return {
      ...data,
      tenantCode: normalizePlatformTenantCode(data.tenantCode),
    };
  }

  const resultVO = data.resultVO ?? {};
  const userId = resultVO.id ?? '';

  return {
    tenantCode: normalizePlatformTenantCode(resultVO.factoryCode),
    userId,
    displayName: resultVO.name?.trim() || undefined,
    email: resultVO.email?.trim() || undefined,
    departmentName: resultVO.departmentName?.trim() || undefined,
    profileImage: resultVO.profileImage?.trim() || undefined,
    signatureImage: resultVO.signatureImage?.trim() || undefined,
    stampImage: resultVO.stampImage?.trim() || undefined,
    role: resolveRole(userId, resultVO.groupNm, resultVO.roleCode),
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
      ...(request.tenantCode
        ? {
            tenantCode: request.tenantCode,
            factoryCode: request.tenantCode,
          }
        : {}),
    },
  );

  const backendErrorMessage = resolveBackendLoginErrorMessage(data);
  if (backendErrorMessage) {
    throw new Error(backendErrorMessage);
  }

  const normalized = normalizeLoginResponse(data);
  return normalized;
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

  const backendErrorMessage = resolveBackendLoginErrorMessage(data);
  if (backendErrorMessage) {
    throw new Error(backendErrorMessage);
  }

  const normalized = normalizeLoginResponse(data);

  if (normalized.role !== 'PLATFORM_ADMIN') {
    throw new Error('플랫폼 관리자 계정만 로그인할 수 있습니다.');
  }

  return normalized;
}
