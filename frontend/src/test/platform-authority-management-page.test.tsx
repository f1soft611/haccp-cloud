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
import { PlatformAuthorityManagementPage } from '../pages/platform-admin/authorities/PlatformAuthorityManagementPage';
import { useAuthStore } from '../shared/store/authStore';

const {
  createPlatformRoleMock,
  updatePlatformRoleMock,
  updatePlatformRoleStatusMock,
  listPlatformRolesPagedMock,
  getPlatformRoleMenuMappingMock,
  listRoleMenuCandidatesByTenantMock,
  savePlatformRoleMenuMappingMock,
  getPlatformRoleFeaturesMock,
  savePlatformRoleFeaturesMock,
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
  updatePlatformRoleStatusMock: vi.fn(async (payload) => ({
    id: payload.id,
    code: payload.code,
    name: payload.code,
    description: '',
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
  listPlatformRolesPagedMock: vi.fn(async () => ({
    items: [
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
    ],
    totalCount: 2,
  })),
  getPlatformRoleMenuMappingMock: vi.fn(async (roleCode: string) => ({
    roleCode,
    menuIds:
      roleCode === 'TENANT_ADMIN'
        ? ['MENU_LOGIN_HISTORY']
        : ['MENU_DASHBOARD', 'MENU_DASHBOARD_STATS'],
  })),
  listRoleMenuCandidatesByTenantMock: vi.fn(async () => [
    'MENU_DASHBOARD',
    'MENU_DASHBOARD_STATS',
    'MENU_LOGIN_HISTORY',
  ]),
  savePlatformRoleMenuMappingMock: vi.fn(async (payload) => payload),
  getPlatformRoleFeaturesMock: vi.fn(async (roleCode: string) => [
    {
      featureCode: 'FEATURE_ROLE_MGMT',
      featureName: '권한 관리',
      featureType: 'BOOLEAN',
      enabled: roleCode === 'PLATFORM_ADMIN',
      limitValue: null,
    },
    {
      featureCode: 'LIMIT_USER_COUNT',
      featureName: '사용자 수 제한',
      featureType: 'LIMIT',
      enabled: true,
      limitValue: roleCode === 'TENANT_ADMIN' ? 50 : 200,
    },
  ]),
  savePlatformRoleFeaturesMock: vi.fn(async (payload) => payload.features),
}));

vi.mock('../services/platform/platformRoleService', () => ({
  listPlatformRolesPaged: listPlatformRolesPagedMock,
  createPlatformRole: createPlatformRoleMock,
  updatePlatformRole: updatePlatformRoleMock,
  updatePlatformRoleStatus: updatePlatformRoleStatusMock,
}));

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: vi.fn(async () => [
    {
      menuId: 'PM-0',
      menuCode: 'MENU_ROLE_PAGE',
      menuNm: '권한/메뉴 관리 커스텀 타이틀',
      menuDc: '권한 페이지 헤더 타이틀 테스트용',
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
}));

vi.mock('../services/platform/platformRoleMenuService', () => ({
  getPlatformRoleMenuMapping: getPlatformRoleMenuMappingMock,
  listRoleMenuCandidatesByTenant: listRoleMenuCandidatesByTenantMock,
  savePlatformRoleMenuMapping: savePlatformRoleMenuMappingMock,
}));

vi.mock('../services/platform/platformRoleFeatureService', () => ({
  getPlatformRoleFeatures: getPlatformRoleFeaturesMock,
  savePlatformRoleFeatures: savePlatformRoleFeaturesMock,
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
    listRoleMenuCandidatesByTenantMock.mockClear();
    getPlatformRoleFeaturesMock.mockClear();
    savePlatformRoleFeaturesMock.mockClear();

    listPlatformRolesPagedMock.mockReset();
    listPlatformRolesPagedMock.mockImplementation(async () => ({
      items: [
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
      ],
      totalCount: 2,
    }));

    getPlatformRoleMenuMappingMock.mockReset();
    getPlatformRoleMenuMappingMock.mockImplementation(
      async (roleCode: string) => ({
        roleCode,
        menuIds:
          roleCode === 'TENANT_ADMIN'
            ? ['MENU_LOGIN_HISTORY']
            : ['MENU_DASHBOARD', 'MENU_DASHBOARD_STATS'],
      }),
    );

    listRoleMenuCandidatesByTenantMock.mockReset();
    listRoleMenuCandidatesByTenantMock.mockImplementation(async () => [
      'MENU_DASHBOARD',
      'MENU_DASHBOARD_STATS',
      'MENU_LOGIN_HISTORY',
    ]);

    getPlatformRoleFeaturesMock.mockReset();
    getPlatformRoleFeaturesMock.mockImplementation(async (roleCode: string) => [
      {
        featureCode: 'FEATURE_ROLE_MGMT',
        featureName: '권한 관리',
        featureType: 'BOOLEAN',
        enabled: roleCode === 'PLATFORM_ADMIN',
        limitValue: null,
      },
      {
        featureCode: 'LIMIT_USER_COUNT',
        featureName: '사용자 수 제한',
        featureType: 'LIMIT',
        enabled: true,
        limitValue: roleCode === 'TENANT_ADMIN' ? 50 : 200,
      },
    ]);
  });

  it('renders authority row data for platform admin context', async () => {
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

    expect(await screen.findByText('PLATFORM_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('플랫폼 관리자')).toBeInTheDocument();
  });

  it('requests paged role list on initial render', async () => {
    listPlatformRolesPagedMock.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        items: [
          {
            id: 'PR-1',
            code: 'PLATFORM_ADMIN',
            name: '플랫폼 관리자',
            description: '플랫폼 운영 권한',
            active: true,
            updatedBy: 'platform_admin',
            updatedAt: '2026-06-18T09:00:00.000Z',
          },
        ],
        totalCount: 1,
      };
    });

    renderPage();

    await screen.findByRole('heading', {
      name: '권한/메뉴 관리 커스텀 타이틀',
    });
    expect(listPlatformRolesPagedMock).toHaveBeenCalled();
  });

  it('shows menu mapping skeleton rows while mapping query is loading', async () => {
    getPlatformRoleMenuMappingMock.mockImplementationOnce(
      async (roleCode: string) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          roleCode,
          menuIds: ['PM-1'],
        };
      },
    );

    renderPage();

    const mappingButtons = await screen.findAllByRole('button', {
      name: '메뉴 매핑',
    });
    fireEvent.click(mappingButtons[0]);

    expect(
      await screen.findByTestId('platform-role-menu-grid-skeleton-row-0'),
    ).toBeInTheDocument();
  });

  it('shows backend error message when authority list query fails', async () => {
    listPlatformRolesPagedMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          resultCode: 'FAIL',
          resultMessage: '오류: "crt_dt" 이름의 칼럼은 없습니다\nPosition: 225',
        },
      },
      message: 'Request failed with status code 500',
    });

    renderPage();

    expect(
      await screen.findByText(/오류: "crt_dt" 이름의 칼럼은 없습니다/),
    ).toBeInTheDocument();
  });

  it('renders grid UI with registration and mapping modals and uses menu title for header', async () => {
    listPlatformRolesPagedMock.mockResolvedValue({
      items: [
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
      ],
      totalCount: 2,
    });

    renderPage();

    expect(
      await screen.findByTestId('platform-authority-management-page'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: '권한/메뉴 관리 커스텀 타이틀',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', {
        name: '설명',
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ 권한 추가' }));

    expect(await screen.findByText('권한 추가')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('ROLE_QA_MANAGER'), {
      target: { value: 'ROLE_QA_MANAGER' },
    });

    const modalTextboxes = screen.getAllByRole('textbox');
    fireEvent.change(modalTextboxes[modalTextboxes.length - 2], {
      target: { value: '품질 관리자' },
    });

    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    fireEvent.click(screen.getAllByRole('button', { name: '등록' }).at(-1)!);

    await waitFor(() => {
      expect(createPlatformRoleMock).toHaveBeenCalled();
      expect(createPlatformRoleMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          code: 'ROLE_QA_MANAGER',
          name: '품질 관리자',
        }),
      );
    });

    expect(await screen.findByText('플랫폼 관리자')).toBeInTheDocument();
    expect(await screen.findByText('업체 관리자')).toBeInTheDocument();

    const editButtons = await screen.findAllByRole('button', {
      name: '권한 수정',
    });
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText('권한 수정')).toBeInTheDocument();
    const editDialog = screen.getByRole('dialog', { name: /권한 수정/ });
    fireEvent.change(
      within(editDialog).getByRole('textbox', { name: /권한명/ }),
      {
        target: { value: '플랫폼 총괄 관리자' },
      },
    );
    fireEvent.change(
      within(editDialog).getByRole('textbox', { name: /설명/ }),
      {
        target: { value: '플랫폼 운영 총괄 권한' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(updatePlatformRoleMock).toHaveBeenCalled();
      expect(updatePlatformRoleMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          id: 'PR-1',
          code: 'PLATFORM_ADMIN',
          name: '플랫폼 총괄 관리자',
          description: '플랫폼 운영 총괄 권한',
          active: true,
        }),
      );
    });

    expect(
      (await screen.findAllByRole('button', { name: '메뉴 매핑' })).length,
    ).toBeGreaterThan(0);

    const tenantRoleMappingButtons = await screen.findAllByRole('button', {
      name: '메뉴 매핑',
    });
    fireEvent.click(tenantRoleMappingButtons[1]);

    expect(await screen.findByText('권한별 메뉴 매핑')).toBeInTheDocument();
    expect(
      await screen.findByRole('checkbox', {
        name: '로그인 이력 (/platform/login-history)',
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getPlatformRoleMenuMappingMock).toHaveBeenCalledWith(
        'TENANT_ADMIN',
        'PLATFORM',
      );
    });

    const dashboardParentCheckbox = screen.getByRole('checkbox', {
      name: '대시보드 (/dashboard)',
    });
    const dashboardChildCheckbox = screen.getByRole('checkbox', {
      name: '대시보드 통계 (/dashboard/stats)',
    });

    fireEvent.click(dashboardParentCheckbox);

    await waitFor(() => {
      expect(dashboardChildCheckbox).toBeChecked();
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(savePlatformRoleMenuMappingMock).toHaveBeenCalled();
      expect(savePlatformRoleMenuMappingMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          roleCode: 'TENANT_ADMIN',
          menuIds: expect.arrayContaining([
            'MENU_DASHBOARD',
            'MENU_DASHBOARD_STATS',
            'MENU_LOGIN_HISTORY',
          ]),
        }),
      );
    });

    const tenantRoleFeatureButtons = await screen.findAllByRole('button', {
      name: '기능 매핑',
    });
    fireEvent.click(tenantRoleFeatureButtons[1]);

    expect(await screen.findByText('권한별 기능 매핑')).toBeInTheDocument();
    expect(await screen.findByText('사용자 수 제한')).toBeInTheDocument();
    expect(screen.getByText('LIMIT')).toBeInTheDocument();

    const limitInput = screen.getByRole('spinbutton', {
      name: 'LIMIT_USER_COUNT 값',
    });
    fireEvent.change(limitInput, { target: { value: '80' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(savePlatformRoleFeaturesMock).toHaveBeenCalled();
      expect(savePlatformRoleFeaturesMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          roleCode: 'TENANT_ADMIN',
          features: expect.arrayContaining([
            expect.objectContaining({
              featureCode: 'LIMIT_USER_COUNT',
              limitValue: 80,
            }),
          ]),
        }),
      );
    });
  }, 15000);

  it('applies page size to paged role API params', async () => {
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
});
