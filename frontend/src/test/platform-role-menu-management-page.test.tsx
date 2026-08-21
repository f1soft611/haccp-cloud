import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformRoleMenuManagementPage } from '../pages/platform-admin/menus/PlatformRoleMenuManagementPage';
import { useAuthStore } from '../shared/store/authStore';

const {
  listPlatformRolesMock,
  listCommonPlatformMenusMock,
  getPlatformRoleMenuMappingMock,
  listRoleMenuCandidatesByTenantMock,
  savePlatformRoleMenuMappingMock,
} = vi.hoisted(() => ({
  listPlatformRolesMock: vi.fn(async () => [
    {
      id: 'PR-1',
      code: 'PLATFORM_ADMIN',
      name: '플랫폼 관리자',
    },
    {
      id: 'PR-2',
      code: 'TENANT_ADMIN',
      name: '업체 관리자',
    },
  ]),
  listCommonPlatformMenusMock: vi.fn(async () => [
    {
      menuId: 'PM-1',
      menuCode: 'MENU_AUTHORITY_MANAGEMENT',
      menuNm: '권한 관리',
      menuDc: '권한 관리 메뉴',
      parentMenuId: null,
      menuOrdr: 1,
      menuUrl: '/platform/roles',
      iconNm: 'Security',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
  ]),
  getPlatformRoleMenuMappingMock: vi.fn(async (roleIdentifier: string) => ({
    roleCode: roleIdentifier,
    menuIds: ['MENU_AUTHORITY_MANAGEMENT'],
  })),
  listRoleMenuCandidatesByTenantMock: vi.fn(async () => [
    'MENU_AUTHORITY_MANAGEMENT',
  ]),
  savePlatformRoleMenuMappingMock: vi.fn(async (payload) => payload),
}));

vi.mock('../services/platform-admin/platformRoleService', () => ({
  listPlatformRoles: listPlatformRolesMock,
}));

vi.mock('../services/platform-admin/platformMenuService', () => ({
  listCommonPlatformMenus: listCommonPlatformMenusMock,
}));

vi.mock('../services/platform-admin/platformRoleMenuService', () => ({
  getPlatformRoleMenuMapping: getPlatformRoleMenuMappingMock,
  listRoleMenuCandidatesByTenant: listRoleMenuCandidatesByTenantMock,
  savePlatformRoleMenuMapping: savePlatformRoleMenuMappingMock,
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformRoleMenuManagementPage />
    </AppProviders>,
  );
}

describe('PlatformRoleMenuManagementPage', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: '000001',
        userId: 'platform_admin',
        displayName: '관리자',
        role: 'PLATFORM_ADMIN',
        accessToken: 'token',
        refreshToken: 'refresh',
        loginHistoryId: 1,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    listPlatformRolesMock.mockClear();
    listCommonPlatformMenusMock.mockClear();
    getPlatformRoleMenuMappingMock.mockClear();
    listRoleMenuCandidatesByTenantMock.mockClear();
    savePlatformRoleMenuMappingMock.mockClear();
  });

  it('uses tenant plan menu candidates and role ids for mapping selection', async () => {
    renderPage();

    expect(
      await screen.findByRole('button', { name: '플랫폼 관리자' }),
    ).toBeInTheDocument();
    expect(listCommonPlatformMenusMock).toHaveBeenCalledTimes(1);
    expect(listRoleMenuCandidatesByTenantMock).toHaveBeenCalledWith('000001');
    expect(getPlatformRoleMenuMappingMock).toHaveBeenCalledWith(
      'PR-1',
      '000001',
    );

    fireEvent.click(screen.getByRole('button', { name: '업체 관리자' }));

    expect(getPlatformRoleMenuMappingMock).toHaveBeenLastCalledWith(
      'PR-2',
      '000001',
    );
  });

  it('keeps the menu list visible when no tenant candidate list is returned', async () => {
    listRoleMenuCandidatesByTenantMock.mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByRole('button', { name: '플랫폼 관리자' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('권한 관리')).toBeInTheDocument();
  });
});
