import { act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, vi } from 'vitest';
import { server } from '../mocks/server';
import { getDashboardMetrics } from '../services/common/dashboardService';
import { apiClient, resolveApiBaseUrl } from '../services/api/apiClient';
import { useAuthStore } from '../shared/store/authStore';

describe('apiClient', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-A',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();

    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        tenantCode: '',
        userId: '',
        role: 'USER',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });
  });

  it('appends /api for an absolute backend subpath', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://218.155.74.34/haccp-cloud');

    expect(resolveApiBaseUrl()).toBe('http://218.155.74.34/haccp-cloud/api');
  });

  it('appends /api for a relative backend subpath', () => {
    vi.stubEnv('VITE_API_BASE_URL', '/haccp-cloud');

    expect(resolveApiBaseUrl()).toBe('/haccp-cloud/api');
  });

  it('clears auth state when API returns 401', async () => {
    server.use(
      http.get('/api/dashboard', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(getDashboardMetrics('TENANT-A')).rejects.toBeTruthy();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.tenantCode).toBe('');
    expect(state.userId).toBe('');
  });

  it('adds bearer token from auth store to request headers', async () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-A',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
        accessToken: 'jwt-tenant-token',
      } as never);
    });

    server.use(
      http.get('/api/protected-check', ({ request }) => {
        const authorization = request.headers.get('authorization');

        if (authorization !== 'Bearer jwt-tenant-token') {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 },
          );
        }

        return HttpResponse.json({ ok: true });
      }),
    );

    const { data } = await apiClient.get<{ ok: boolean }>('/protected-check');
    expect(data.ok).toBe(true);
  });
});
