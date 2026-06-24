import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformMenuManagementPage } from '../pages/platform-admin/menus/PlatformMenuManagementPage';
import { useAuthStore } from '../shared/store/authStore';

const { listPlatformMenusMock } = vi.hoisted(() => ({
  listPlatformMenusMock: vi.fn(async () => [
    {
      menuId: 'PM-1',
      menuCode: 'MENU_PLATFORM_MENU',
      menuNm: '메뉴 관리',
      menuDc: '플랫폼 메뉴 관리',
      menuUrl: '/test',
      parentMenuId: null,
      menuOrdr: 1,
      iconNm: 'Menu',
      useAt: 'Y',
    },
  ]),
}));

const { listPlatformMenusPagedMock } = vi.hoisted(() => ({
  listPlatformMenusPagedMock: vi.fn(),
}));

const { createPlatformMenuMock, updatePlatformMenuMock } = vi.hoisted(() => ({
  createPlatformMenuMock: vi.fn(),
  updatePlatformMenuMock: vi.fn(),
}));

const DEFAULT_MENUS = [
  {
    menuId: 'PM-1',
    menuCode: 'MENU_PLATFORM_MENU',
    menuNm: '메뉴 관리',
    menuDc: '플랫폼 메뉴 관리',
    menuUrl: '/test',
    parentMenuId: null,
    menuOrdr: 1,
    iconNm: 'Menu',
    useAt: 'Y',
  },
];

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: listPlatformMenusMock,
  listPlatformMenusPaged: listPlatformMenusPagedMock,
  createPlatformMenu: createPlatformMenuMock,
  updatePlatformMenu: updatePlatformMenuMock,
  deletePlatformMenu: vi.fn(),
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformMenuManagementPage />
    </AppProviders>,
  );
}

describe('PlatformMenuManagementPage', () => {
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

    listPlatformMenusMock.mockReset();
    listPlatformMenusMock.mockImplementation(async () => DEFAULT_MENUS);
    listPlatformMenusPagedMock.mockReset();
    listPlatformMenusPagedMock.mockImplementation(async () => ({
      items: DEFAULT_MENUS,
      totalCount: 1,
    }));
    createPlatformMenuMock.mockReset();
    createPlatformMenuMock.mockResolvedValue(undefined);
    updatePlatformMenuMock.mockReset();
    updatePlatformMenuMock.mockResolvedValue(undefined);
  });

  it('uses dark row background for platform admin theme', async () => {
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

    const urlCell = await screen.findByText('/test');
    const row = urlCell.closest('tr');

    expect(row).not.toBeNull();
    expect(window.getComputedStyle(urlCell).backgroundColor).not.toBe(
      'rgb(255, 255, 255)',
    );
  });

  it('requests paged menu list on initial render', async () => {
    listPlatformMenusPagedMock.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        items: DEFAULT_MENUS,
        totalCount: 1,
      };
    });

    renderPage();

    await screen.findByRole('heading', { name: '메뉴 관리' });
    expect(listPlatformMenusPagedMock).toHaveBeenCalled();
  });

  it('uses shared FormDialog for menu edit modal', async () => {
    renderPage();

    await screen.findByRole('heading', { name: '메뉴 관리' });

    const editIcons = await screen.findAllByTestId('EditOutlinedIcon');
    const firstEditButton = editIcons[0]?.closest('button');

    expect(firstEditButton).not.toBeNull();

    fireEvent.click(firstEditButton as HTMLButtonElement);

    expect(
      await screen.findByTestId('form-dialog-actions'),
    ).toBeInTheDocument();
  });

  it('renders add modal actions in order: 추가 then 취소', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '+ 메뉴 추가' }));

    const addButton = await screen.findByRole('button', { name: '추가' });
    const cancelButton = await screen.findByRole('button', { name: '취소' });

    const buttonPosition = addButton.compareDocumentPosition(cancelButton);
    expect(buttonPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('applies search and page size to paged API params', async () => {
    renderPage();

    await screen.findByRole('heading', { name: '메뉴 관리' });

    fireEvent.change(screen.getByLabelText('검색어'), {
      target: { value: '관리' },
    });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: '페이지 크기 선택' }),
    );
    fireEvent.click(screen.getByRole('option', { name: '20개' }));

    expect(listPlatformMenusPagedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 1,
        pageSize: 20,
        searchKeyword: '관리',
      }),
    );
  });

  it('renders child-only page rows without showing empty message', async () => {
    listPlatformMenusPagedMock.mockImplementationOnce(async () => ({
      items: [
        {
          menuId: 'PM-2',
          menuCode: 'MENU_LOGIN_HISTORY',
          menuNm: '로그인 이력',
          menuDc: '자식 메뉴',
          menuUrl: '/platform/login-history',
          parentMenuId: 'PM-1',
          menuOrdr: 2,
          iconNm: 'Menu',
          useAt: 'Y',
          hasChildren: false,
        },
      ],
      totalCount: 1,
    }));

    renderPage();

    expect(await screen.findByText('로그인 이력')).toBeInTheDocument();
    expect(screen.getByText('상위 메뉴: 메뉴 관리')).toBeInTheDocument();
    expect(screen.queryByText('메뉴가 없습니다.')).not.toBeInTheDocument();
  });

  it('disables delete when hasChildren is true even if child row is not on current page', async () => {
    listPlatformMenusPagedMock.mockImplementationOnce(async () => ({
      items: [
        {
          menuId: 'PM-1',
          menuCode: 'MENU_ROOT',
          menuNm: '상위 메뉴',
          menuDc: '부모 메뉴',
          menuUrl: '/platform/root',
          parentMenuId: null,
          menuOrdr: 1,
          iconNm: 'Menu',
          useAt: 'Y',
          hasChildren: true,
        },
      ],
      totalCount: 1,
    }));

    renderPage();

    const rowCell = await screen.findByText('상위 메뉴');
    const row = rowCell.closest('tr');
    expect(row).not.toBeNull();

    const deleteIcon = within(row as HTMLTableRowElement).getByTestId(
      'DeleteOutlineOutlinedIcon',
    );
    const deleteButton = deleteIcon.closest('button');
    expect(deleteButton).not.toBeNull();
    expect(deleteButton).toBeDisabled();
  });

  it('allows adding a root menu without a menu URL', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '+ 메뉴 추가' }));

    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getAllByRole('textbox')[1], {
      target: { value: '새 루트 메뉴' },
    });

    const addButton = within(dialog).getByRole('button', { name: '추가' });
    expect(addButton).toBeEnabled();
  });

  it('allows editing a root menu that has an empty menu URL', async () => {
    const rootMenuWithoutUrl = {
      menuId: 'PM-ROOT',
      menuCode: 'MENU_ROOT_GROUP',
      menuNm: '루트 그룹',
      menuDc: '최상위 그룹',
      menuUrl: '',
      parentMenuId: null,
      menuOrdr: 1,
      iconNm: 'Settings',
      useAt: 'Y' as const,
    };

    listPlatformMenusMock.mockImplementationOnce(async () => [
      rootMenuWithoutUrl,
    ]);
    listPlatformMenusPagedMock.mockImplementationOnce(async () => ({
      items: [rootMenuWithoutUrl],
      totalCount: 1,
    }));

    renderPage();

    const editIcons = await screen.findAllByTestId('EditOutlinedIcon');
    const firstEditButton = editIcons[0]?.closest('button');

    expect(firstEditButton).not.toBeNull();
    fireEvent.click(firstEditButton as HTMLButtonElement);

    const dialog = await screen.findByRole('dialog');
    const saveButton = within(dialog).getByRole('button', { name: '저장' });
    expect(saveButton).toBeEnabled();
  });
});
