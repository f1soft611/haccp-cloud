import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
      'PLATFORM_ADMIN',
      '000001',
    );

    fireEvent.click(screen.getByRole('button', { name: '업체 관리자' }));

    expect(getPlatformRoleMenuMappingMock).toHaveBeenLastCalledWith(
      'TENANT_ADMIN',
      '000001',
    );
  });

  it('shows no menu when the central plan-allowed candidate list is empty', async () => {
    listRoleMenuCandidatesByTenantMock.mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByRole('button', { name: '플랫폼 관리자' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('권한 관리')).not.toBeInTheDocument();
  });

  it('filters selected and saved menu ids to the central plan-allowed list', async () => {
    listCommonPlatformMenusMock.mockResolvedValueOnce([
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
      {
        menuId: 'PM-2',
        menuCode: 'MENU_DASHBOARD',
        menuNm: '대시보드',
        menuDc: '대시보드 메뉴',
        parentMenuId: null,
        menuOrdr: 2,
        menuUrl: '/dashboard',
        iconNm: 'Dashboard',
        useAt: 'Y',
        frstRegistPnttm: '',
        frstRegisterId: '',
        lastUpdtPnttm: '',
        lastUpdusrId: '',
      },
    ]);
    listRoleMenuCandidatesByTenantMock.mockResolvedValueOnce([
      'MENU_AUTHORITY_MANAGEMENT',
    ]);
    getPlatformRoleMenuMappingMock.mockResolvedValueOnce({
      roleCode: 'TENANT_ADMIN',
      menuIds: ['MENU_AUTHORITY_MANAGEMENT', 'MENU_DASHBOARD'],
    });

    renderPage();

    expect(
      await screen.findByRole('button', { name: '플랫폼 관리자' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/권한 관리/)).toBeInTheDocument();
      expect(screen.queryByText(/대시보드/)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('권한별 메뉴 매핑이 저장되었습니다.');

    expect(savePlatformRoleMenuMappingMock).toHaveBeenCalledTimes(1);
    expect(savePlatformRoleMenuMappingMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        roleCode: 'PLATFORM_ADMIN',
        tenantCode: '000001',
        menuIds: ['MENU_AUTHORITY_MANAGEMENT'],
      }),
    );
  });
});
