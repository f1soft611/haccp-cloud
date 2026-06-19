import { describe, expect, it, vi, beforeEach } from 'vitest';
import { login, loginPlatformAdmin } from '../services/auth/authService';
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
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      password: 'Passw0rd!',
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

  it('maps app roles to authority codes for runtime menu lookup', () => {
    expect(toAuthorityCode('PLATFORM_ADMIN')).toBe('PLATFORM_ADMIN');
    expect(toAuthorityCode('TENANT_ADMIN')).toBe('TENANT_ADMIN');
    expect(toAuthorityCode('USER')).toBe('TENANT_USER');
  });
});
