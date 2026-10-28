import { afterEach, describe, expect, it, vi } from 'vitest';

const AUTH_STORAGE_KEY = 'haccp.auth';

async function loadStoreWithPersistedRole(role: string) {
  window.sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'user_01',
      role,
      accessToken: 'token',
    }),
  );
  vi.resetModules();
  const { useAuthStore } = await import('../shared/store/authStore');
  return useAuthStore;
}

describe('authStore role normalize', () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('converts legacy persisted USER role to TENANT_USER', async () => {
    const useAuthStore = await loadStoreWithPersistedRole('USER');

    expect(useAuthStore.getState().role).toBe('TENANT_USER');
  });

  it('keeps persisted TENANT_USER role', async () => {
    const useAuthStore = await loadStoreWithPersistedRole('TENANT_USER');

    expect(useAuthStore.getState().role).toBe('TENANT_USER');
  });
});
