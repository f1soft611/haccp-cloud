import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TopGovBar } from '../shared/components/layout/TopGovBar';
import { useAuthStore } from '../shared/store/authStore';
import { getStoredThemeMode } from '../shared/theme/themePreference';

describe('TopGovBar', () => {
  it('stores dark theme preference for current user', async () => {
    window.localStorage.clear();

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

    render(
      <MemoryRouter>
        <TopGovBar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '테마' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '다크 테마' }));

    expect(getStoredThemeMode('tenant_admin')).toBe('dark');
  });

  it('navigates to home when app title is clicked', async () => {
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

    render(
      <MemoryRouter initialEntries={['/documents']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/documents"
            element={
              <>
                <TopGovBar />
                <div>documents-page</div>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const titleLink = screen.getByRole('link', {
      name: 'HACCP 관리시스템 문서 포털 홈으로 이동',
    });

    expect(titleLink).toHaveAttribute('href', '/');

    fireEvent.click(titleLink);

    expect(await screen.findByText('home-page')).toBeInTheDocument();
  });
});
