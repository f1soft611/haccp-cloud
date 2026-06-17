import { act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect } from 'vitest';
import { server } from '../mocks/server';
import { getDashboardMetrics } from '../services/common/dashboardService';
import { apiClient } from '../services/api/apiClient';
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
