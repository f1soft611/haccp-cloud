import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformAuthorityManagementPage } from '../pages/platform-admin/authorities/PlatformAuthorityManagementPage';

const {
  listPlatformRolesMock,
  getPlatformRoleMenuMappingMock,
  savePlatformRoleMenuMappingMock,
} = vi.hoisted(() => ({
  listPlatformRolesMock: vi.fn(async () => [
    {
      id: 'PR-1',
      code: 'PLATFORM_ADMIN',
      name: '플랫폼 관리자',
      description: '플랫폼 운영 권한',
      active: true,
      updatedBy: 'platform_admin',
      updatedAt: '2026-06-18T09:00:00.000Z',
    },
    {
      id: 'PR-2',
      code: 'TENANT_ADMIN',
      name: '업체 관리자',
      description: '업체 운영 권한',
      active: true,
      updatedBy: 'platform_admin',
      updatedAt: '2026-06-18T09:00:00.000Z',
    },
  ]),
  getPlatformRoleMenuMappingMock: vi.fn(async (roleCode: string) => ({
    roleCode,
    menuIds: roleCode === 'TENANT_ADMIN' ? ['PM-2'] : ['PM-1'],
  })),
  savePlatformRoleMenuMappingMock: vi.fn(async (payload) => payload),
}));

vi.mock('../services/platform/platformRoleService', () => ({
  listPlatformRoles: listPlatformRolesMock,
  createPlatformRole: vi.fn(),
  updatePlatformRoleStatus: vi.fn(),
}));

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: vi.fn(async () => [
    {
      menuId: 'PM-1',
      menuNm: '대시보드',
      menuDc: '대시보드 메뉴',
      parentMenuId: null,
      menuOrdr: 1,
      menuUrl: '/dashboard',
      iconNm: 'Dashboard',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
    {
      menuId: 'PM-2',
      menuNm: '로그인 이력',
      menuDc: '로그인 이력 메뉴',
      parentMenuId: null,
      menuOrdr: 2,
      menuUrl: '/login-history',
      iconNm: 'AccessTime',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
  ]),
}));

vi.mock('../services/platform/platformRoleMenuService', () => ({
  getPlatformRoleMenuMapping: getPlatformRoleMenuMappingMock,
  savePlatformRoleMenuMapping: savePlatformRoleMenuMappingMock,
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformAuthorityManagementPage />
    </AppProviders>,
  );
}

describe('PlatformAuthorityManagementPage', () => {
  it('renders authority form and role menu controls in one page and supports basic interaction', async () => {
    renderPage();

    expect(
      await screen.findByTestId('platform-authority-management-page'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('권한 코드')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: '플랫폼 관리자' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: '업체 관리자' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('checkbox', { name: '대시보드 (/dashboard)' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '저장' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '업체 관리자' }));

    await waitFor(() => {
      expect(getPlatformRoleMenuMappingMock).toHaveBeenCalledWith('TENANT_ADMIN');
    });

    const loginHistoryCheckbox = screen.getByRole('checkbox', {
      name: '로그인 이력 (/login-history)',
    });
    fireEvent.click(loginHistoryCheckbox);

    const saveButtons = screen.getAllByRole('button', { name: '저장' });
    fireEvent.click(saveButtons[saveButtons.length - 1]);

    await waitFor(() => {
      expect(savePlatformRoleMenuMappingMock).toHaveBeenCalled();
    });
  });
});
