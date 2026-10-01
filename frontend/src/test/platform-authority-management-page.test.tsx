import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformAuthorityManagementPage } from '../pages/organization/authorities/PlatformAuthorityManagementPage';
import { useAuthStore } from '../shared/store/authStore';

const {
  createPlatformRoleMock,
  updatePlatformRoleMock,
  updatePlatformRoleStatusMock,
  listPlatformRolesPagedMock,
  listCommonPlatformMenusMock,
  listRoleMenuCandidatesByTenantMock,
  getPlatformRoleMenuMappingMock,
  savePlatformRoleMenuMappingMock,
} = vi.hoisted(() => ({
  createPlatformRoleMock: vi.fn(async (payload) => ({
    id: 'PR-NEW',
    code: payload.code,
    name: payload.name,
    description: payload.description,
    active: payload.active,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-18T09:00:00.000Z',
  })),
  updatePlatformRoleMock: vi.fn(async (payload) => ({
    id: payload.id,
    code: payload.code,
    name: payload.name,
    description: payload.description ?? '',
    active: payload.active,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-18T09:00:00.000Z',
  })),
  updatePlatformRoleStatusMock: vi.fn(async (payload) => ({
    id: payload.id,
    code: payload.code,
    name: payload.code,
    description: '',
    active: payload.active,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-18T09:00:00.000Z',
  })),
  listPlatformRolesPagedMock: vi.fn(async () => ({
    items: [
      {
        id: 'PR-1',
        code: 'PLATFORM_ADMIN',
        name: '플랫폼 관리자',
        description: '플랫폼 운영 권한',
        systemRole: true,
        active: true,
        updatedBy: 'platform_admin',
        updatedAt: '2026-06-18T09:00:00.000Z',
      },
      {
        id: 'PR-2',
        code: 'TENANT_ADMIN',
        name: '업체 관리자',
        description: '업체 운영 권한',
        systemRole: false,
        active: true,
        updatedBy: 'platform_admin',
        updatedAt: '2026-06-18T09:00:00.000Z',
      },
    ],
    totalCount: 2,
  })),
  listCommonPlatformMenusMock: vi.fn(async () => [
    {
      menuId: 'PM-0',
      menuCode: 'MENU_ROLE_PAGE',
      menuNm: '권한/메뉴 관리 커스텀 타이틀',
      menuDc: '권한 페이지 헤더 타이틀 테스트용',
      parentMenuNm: '조직 관리',
      parentMenuId: null,
      menuOrdr: 0,
      menuUrl: '/platform/roles',
      iconNm: 'Security',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
    {
      menuId: 'PM-1',
      menuCode: 'MENU_DASHBOARD',
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
      menuId: 'PM-1-1',
      menuCode: 'MENU_DASHBOARD_STATS',
      menuNm: '대시보드 통계',
      menuDc: '대시보드 통계 메뉴',
      parentMenuId: 'PM-1',
      menuOrdr: 1,
      menuUrl: '/dashboard/stats',
      iconNm: 'StackedBarChart',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
    {
      menuId: 'PM-2',
      menuCode: 'MENU_LOGIN_HISTORY',
      menuNm: '로그인 이력',
      menuDc: '로그인 이력 메뉴',
      parentMenuId: null,
      menuOrdr: 2,
      menuUrl: '/platform/login-history',
      iconNm: 'AccessTime',
      useAt: 'Y',
      frstRegistPnttm: '',
      frstRegisterId: '',
      lastUpdtPnttm: '',
      lastUpdusrId: '',
    },
  ]),
  getPlatformRoleMenuMappingMock: vi.fn(async (roleIdentifier: string) => ({
    roleCode: roleIdentifier,
    menuIds:
      roleIdentifier === 'PR-2' || roleIdentifier === 'TENANT_ADMIN'
        ? ['MENU_LOGIN_HISTORY']
        : ['MENU_DASHBOARD', 'MENU_DASHBOARD_STATS'],
  })),
  listRoleMenuCandidatesByTenantMock: vi.fn(async () => [
    'MENU_DASHBOARD',
    'MENU_DASHBOARD_STATS',
  ]),
  savePlatformRoleMenuMappingMock: vi.fn(async (payload) => payload),
}));

vi.mock('../services/platform-admin/platformRoleService', () => ({
  listPlatformRolesPaged: listPlatformRolesPagedMock,
  createPlatformRole: createPlatformRoleMock,
  updatePlatformRole: updatePlatformRoleMock,
  updatePlatformRoleStatus: updatePlatformRoleStatusMock,
}));

vi.mock('../services/platform-admin/platformMenuService', () => ({
  listCommonPlatformMenus: listCommonPlatformMenusMock,
}));

vi.mock('../services/platform-admin/platformRoleMenuService', () => ({
  listRoleMenuCandidatesByTenant: listRoleMenuCandidatesByTenantMock,
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
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        tenantCode: '',
        userId: '',
        role: 'USER',
        accessToken: '',
        refreshToken: '',
        loginHistoryId: undefined,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    createPlatformRoleMock.mockClear();
    updatePlatformRoleMock.mockClear();
    updatePlatformRoleStatusMock.mockClear();
    savePlatformRoleMenuMappingMock.mockClear();

    listPlatformRolesPagedMock.mockReset();
    listPlatformRolesPagedMock.mockResolvedValue({
      items: [
        {
          id: 'PR-1',
          code: 'PLATFORM_ADMIN',
          name: '플랫폼 관리자',
          description: '플랫폼 운영 권한',
          systemRole: true,
          active: true,
          updatedBy: 'platform_admin',
          updatedAt: '2026-06-18T09:00:00.000Z',
        },
        {
          id: 'PR-2',
          code: 'TENANT_ADMIN',
          name: '업체 관리자',
          description: '업체 운영 권한',
          systemRole: false,
          active: true,
          updatedBy: 'platform_admin',
          updatedAt: '2026-06-18T09:00:00.000Z',
        },
      ],
      totalCount: 2,
    });

    getPlatformRoleMenuMappingMock.mockReset();
    getPlatformRoleMenuMappingMock.mockImplementation(
      async (roleIdentifier: string) => ({
        roleCode: roleIdentifier,
        menuIds:
          roleIdentifier === 'PR-2' || roleIdentifier === 'TENANT_ADMIN'
            ? ['MENU_LOGIN_HISTORY']
            : ['MENU_DASHBOARD', 'MENU_DASHBOARD_STATS'],
      }),
    );

    listRoleMenuCandidatesByTenantMock.mockReset();
    listRoleMenuCandidatesByTenantMock.mockResolvedValue([
      'MENU_DASHBOARD',
      'MENU_DASHBOARD_STATS',
    ]);
  });

  it('renders authority rows and opens create/edit dialogs', async () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: '000001',
        userId: 'platform_admin',
        role: 'PLATFORM_ADMIN',
        accessToken: 'token',
        refreshToken: 'refresh',
        loginHistoryId: 1,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    renderPage();

    expect(
      await screen.findByRole('columnheader', { name: '권한 코드' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('조직 관리')).toBeInTheDocument();
    expect(await screen.findByText('PLATFORM_ADMIN')).toBeInTheDocument();
    await waitFor(() => {
      expect(listPlatformRolesPagedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 1,
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '+ 권한 추가' }));
    expect(await screen.findByText('권한 추가')).toBeInTheDocument();

    const createDialog = screen.getByRole('dialog', { name: /권한 추가/ });
    const createTextboxes = within(createDialog).getAllByRole('textbox');

    fireEvent.change(createTextboxes[0], {
      target: { value: 'ROLE_QA_MANAGER' },
    });
    fireEvent.change(createTextboxes[1], {
      target: { value: '품질 관리자' },
    });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    fireEvent.click(screen.getAllByRole('button', { name: '등록' }).at(-1)!);

    await waitFor(() => {
      expect(createPlatformRoleMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          code: 'ROLE_QA_MANAGER',
          name: '품질 관리자',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /!/ }),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getAllByRole('button', { name: '권한 수정' })[0],
    ).toBeDisabled();

    await waitFor(() => {
      expect(screen.getAllByText('시스템').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: '권한 수정' })[1]);
    expect(await screen.findByText('권한 수정')).toBeInTheDocument();
    const editDialog = screen.getByRole('dialog', { name: /권한 수정/ });
    const editTextboxes = within(editDialog).getAllByRole('textbox');
    fireEvent.change(editTextboxes[1], {
      target: { value: '플랫폼 총괄 관리자' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(updatePlatformRoleMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          id: 'PR-2',
          code: 'TENANT_ADMIN',
          name: '플랫폼 총괄 관리자',
        }),
      );
    });
  }, 15000);

  it('opens menu mapping and saves selected menus', async () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: '000001',
        userId: 'platform_admin',
        role: 'PLATFORM_ADMIN',
        accessToken: 'token',
        refreshToken: 'refresh',
        loginHistoryId: 1,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    renderPage();

    const mappingButtons = await screen.findAllByRole('button', {
      name: '메뉴 매핑',
    });
    fireEvent.click(mappingButtons[1]);

    expect(await screen.findByText('권한별 메뉴 매핑')).toBeInTheDocument();

    await waitFor(() => {
      expect(listRoleMenuCandidatesByTenantMock).toHaveBeenCalledWith('000001');
    });

    const mappingDialog = screen.getByRole('dialog', {
      name: /권한별 메뉴 매핑/,
    });

    expect(
      within(mappingDialog).queryByRole('checkbox', {
        name: '로그인 이력 (/platform/login-history)',
      }),
    ).not.toBeInTheDocument();
    const dashboardParentCheckbox = await within(mappingDialog).findByRole(
      'checkbox',
      {
        name: '대시보드 (/dashboard)',
      },
      {
        timeout: 5000,
      },
    );
    fireEvent.click(dashboardParentCheckbox);

    await waitFor(
      () => {
        expect(
          within(mappingDialog).getByRole('checkbox', {
            name: '대시보드 통계 (/dashboard/stats)',
          }),
        ).toBeChecked();
      },
      { timeout: 5000 },
    );

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(savePlatformRoleMenuMappingMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          roleCode: 'TENANT_ADMIN',
          tenantCode: '000001',
          menuIds: expect.arrayContaining([
            'MENU_DASHBOARD',
            'MENU_DASHBOARD_STATS',
          ]),
        }),
      );
    });

    expect(
      savePlatformRoleMenuMappingMock.mock.calls[0]?.[0].menuIds,
    ).not.toContain('MENU_LOGIN_HISTORY');
  });

  it('applies page size to the paged role query', async () => {
    renderPage();

    await screen.findByText('플랫폼 관리자');

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: '페이지 크기 선택' }),
    );
    fireEvent.click(screen.getByRole('option', { name: '20개' }));

    await waitFor(() => {
      expect(listPlatformRolesPagedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 1,
          pageSize: 20,
        }),
      );
    });
  });

  it('renders when the current page menu has no URL', async () => {
    listCommonPlatformMenusMock.mockResolvedValueOnce([
      {
        menuId: 'PM-0',
        menuCode: 'MENU_ROLE_PAGE',
        menuNm: '권한/메뉴 관리 커스텀 타이틀',
        menuDc: '권한 페이지 헤더 타이틀 테스트용',
        parentMenuNm: '조직 관리',
        parentMenuId: null,
        menuOrdr: 0,
        menuUrl: null as unknown as string,
        iconNm: 'Security',
        useAt: 'Y',
        frstRegistPnttm: '',
        frstRegisterId: '',
        lastUpdtPnttm: '',
        lastUpdusrId: '',
      },
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: '플랫폼 권한/메뉴 관리',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('플랫폼 관리')).toBeInTheDocument();
  });
});
