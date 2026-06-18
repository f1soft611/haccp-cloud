import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformAuthorityManagementPage } from '../pages/platform-admin/authorities/PlatformAuthorityManagementPage';

const {
  createPlatformRoleMock,
  updatePlatformRoleMock,
  updatePlatformRoleStatusMock,
  listPlatformRolesMock,
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
  updatePlatformRoleStatusMock: vi.fn(async (payload) => ({
    id: payload.code,
    code: payload.code,
    name: payload.code,
    description: '',
    active: payload.active,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-18T09:00:00.000Z',
  })),
  updatePlatformRoleMock: vi.fn(async (payload) => ({
    id: payload.code,
    code: payload.code,
    name: payload.name,
    description: payload.description ?? '',
    active: payload.active,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-18T09:00:00.000Z',
  })),
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
  createPlatformRole: createPlatformRoleMock,
  updatePlatformRole: updatePlatformRoleMock,
  updatePlatformRoleStatus: updatePlatformRoleStatusMock,
}));

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: vi.fn(async () => [
    {
      menuId: 'PM-0',
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
  it('shows backend error message when authority list query fails', async () => {
    listPlatformRolesMock.mockRejectedValue({
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
    listPlatformRolesMock.mockResolvedValue([
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
    ]);

    renderPage();

    expect(
      await screen.findByTestId('platform-authority-management-page'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: '권한/메뉴 관리 커스텀 타이틀',
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

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(updatePlatformRoleMock).toHaveBeenCalled();
      expect(updatePlatformRoleMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          code: 'PLATFORM_ADMIN',
          name: '플랫폼 총괄 관리자',
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
        name: '로그인 이력 (/login-history)',
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getPlatformRoleMenuMappingMock).toHaveBeenCalledWith(
        'TENANT_ADMIN',
      );
    });

    const loginHistoryCheckbox = screen.getByRole('checkbox', {
      name: '로그인 이력 (/login-history)',
    });
    fireEvent.click(loginHistoryCheckbox);

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(screen.getAllByRole('button', { name: '저장' }).at(-1)!);

    await waitFor(() => {
      expect(savePlatformRoleMenuMappingMock).toHaveBeenCalled();
      expect(savePlatformRoleMenuMappingMock.mock.calls[0]?.[0]).toEqual({
        roleCode: 'TENANT_ADMIN',
        menuIds: [],
      });
    });
  });
});
