import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loginPlatformAdmin } from '../services/authService';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
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
      userId: 'platform_admin',
      password: 'Passw0rd!',
    });
  });
});
