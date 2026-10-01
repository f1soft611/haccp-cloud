import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DepartmentsPage } from '../pages/organization/departments/DepartmentsPage';
import { useAuthStore } from '../shared/store/authStore';

const { listDepartmentsMock } = vi.hoisted(() => ({
  listDepartmentsMock: vi.fn(async () => []),
}));

function renderPage() {
  render(
    <AppProviders>
      <DepartmentsPage />
    </AppProviders>,
  );
}

describe('DepartmentsPage', () => {
  beforeEach(() => {
    listDepartmentsMock.mockClear();

    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: '',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      accessToken: 'token',
      refreshToken: 'refresh',
      loginHistoryId: 1,
      onboardingRequired: true,
      onboardingStatus: 'NOT_STARTED',
    });
  });

  it('passes the authenticated tenant code without replacing it with a fallback', async () => {
    renderPage();

    await waitFor(() => {
      expect(listDepartmentsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode: '',
        }),
      );
    });
  });
});
