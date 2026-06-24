import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  login,
  loginPlatformAdmin,
  resolveAuthUrl,
} from '../services/auth/authService';
import { apiClient } from '../services/api/apiClient';
import { toAuthorityCode } from '../shared/auth/authorityCode';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('preserves configured backend subpath for auth URLs', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://218.155.74.34/haccp-cloud');

    expect(resolveAuthUrl('/auth/login-jwt')).toBe(
      'http://218.155.74.34/haccp-cloud/auth/login-jwt',
    );
  });

  it('supports relative backend subpath for auth URLs', () => {
    vi.stubEnv('VITE_API_BASE_URL', '/haccp-cloud');

    expect(resolveAuthUrl('/auth/login-jwt')).toBe(
      '/haccp-cloud/auth/login-jwt',
    );
  });

  it('calls platform admin login endpoint', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        tenantCode: '000001',
        userId: 'platform_admin',
        role: 'PLATFORM_ADMIN',
        accessToken: 'token',
      },
    });

    await loginPlatformAdmin({
      userId: 'platform_admin',
      password: 'Passw0rd!',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/login-jwt/admin', {
      id: 'platform_admin',
      password: 'Passw0rd!',
    });
  });

  it('calls tenant login endpoint as jwt login', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        tenantCode: 'TENANT-A',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        accessToken: 'token',
      },
    });

    await login({
      userId: 'platform_admin',
      password: 'test_password',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/login-jwt', {
      id: 'tenant_admin',
      password: 'Passw0rd!',
      factoryCode: 'TENANT-A',
      tenantCode: 'TENANT-A',
    });
  });

  it('normalizes backend jwt envelope response', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        resultCode: '200',
        jToken: 'jwt-token',
        refreshToken: 'refresh-token',
        loginHistoryId: 101,
        resultVO: {
          factoryCode: '000001',
          id: 'platform_admin',
          name: '플랫폼관리자',
          groupNm: 'ROLE_ADMIN',
        },
      },
    });

    const result = await loginPlatformAdmin({
      userId: 'platform_admin',
      password: 'Passw0rd!',
    });

    expect(result).toEqual({
      tenantCode: '000001',
      userId: 'platform_admin',
      displayName: '플랫폼관리자',
      role: 'PLATFORM_ADMIN',
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
      loginHistoryId: 101,
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  it('treats roleCode PLATFORM_ADMIN as platform role even when groupNm is missing', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        resultCode: '200',
        jToken: 'jwt-token',
        resultVO: {
          factoryCode: '000001',
          id: 'platform_admin',
          roleCode: 'PLATFORM_ADMIN',
        },
      },
    });

    const result = await loginPlatformAdmin({
      userId: 'platform_admin',
      password: 'Passw0rd!',
    });

    expect(result.role).toBe('PLATFORM_ADMIN');
  });

  it('rejects platform admin login when backend role is not PLATFORM_ADMIN', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        resultCode: '200',
        jToken: 'jwt-token',
        resultVO: {
          factoryCode: '000001',
          id: 'tenant_user',
          groupNm: 'ROLE_USER',
        },
      },
    });

    await expect(
      loginPlatformAdmin({
        userId: 'tenant_user',
        password: 'Passw0rd!',
      }),
    ).rejects.toThrow('플랫폼 관리자 계정만 로그인할 수 있습니다.');
  });

  it('surfaces backend failure message for platform admin login', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        resultCode: 'FAIL',
        message: "개체 이름 'TB_UserInfo'이(가) 잘못되었습니다.",
      },
    });

    await expect(
      loginPlatformAdmin({
        userId: 'platform_admin',
        password: 'Passw0rd!',
      }),
    ).rejects.toThrow("개체 이름 'TB_UserInfo'이(가) 잘못되었습니다.");
  });

  it('surfaces backend failure message for tenant login', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValue({
      data: {
        resultCode: 'FAIL',
        resultMessage: '로그인 처리 중 오류가 발생했습니다.',
      },
    });

    await expect(
      login({
        userId: 'platform_admin',
        password: 'wrong_password',
      }),
    ).rejects.toThrow('로그인 처리 중 오류가 발생했습니다.');
  });

  it('maps app roles to authority codes for runtime menu lookup', () => {
    expect(toAuthorityCode('PLATFORM_ADMIN')).toBe('PLATFORM_ADMIN');
    expect(toAuthorityCode('TENANT_ADMIN')).toBe('TENANT_ADMIN');
    expect(toAuthorityCode('USER')).toBe('TENANT_USER');
  });
});
