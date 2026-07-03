import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  createPlatformMenu,
  listCommonPlatformMenus,
  listPlatformMenus,
  listPlatformMenusPaged,
  updatePlatformMenu,
} from '../services/platform-admin/platformMenuService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('platformMenuService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls paged endpoint and normalizes result wrapper', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          menuList: [
            {
              menuId: 'MENU_1',
              menuNm: '메뉴 관리',
              menuDc: '메뉴 관리 화면',
              parentMenuId: '',
              menuOrdr: 1,
              menuUrl: '/platform/menus',
              iconNm: 'Menu',
              useAt: 'Y',
              frstRegistPnttm: '',
              frstRegisterId: '',
              lastUpdtPnttm: '',
              lastUpdusrId: '',
            },
          ],
          totalCount: 23,
        },
      },
    });

    const response = await listPlatformMenusPaged({
      pageIndex: 2,
      pageSize: 10,
      searchField: 'menuNm',
      searchKeyword: '관리',
      useAt: 'Y',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/platform-admin/menus/paged',
      {
        params: {
          pageIndex: 2,
          pageSize: 10,
          searchField: 'menuNm',
          searchKeyword: '관리',
          useAt: 'Y',
        },
      },
    );
    expect(response.totalCount).toBe(23);
    expect(response.items[0].parentMenuId).toBeNull();
  });

  it('normalizes numeric menu ids from backend list response', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          menuId: 101,
          menuCode: 'MENU_101',
          menuNm: '플랫폼 메뉴 관리',
          menuDc: '메뉴 관리',
          parentMenuId: 100,
          parentMenuCode: 'MENU_100',
          menuOrdr: 1,
          menuUrl: '/platform/menus',
          iconNm: 'Menu',
          useAt: 'Y',
          frstRegistPnttm: '',
          frstRegisterId: '',
          lastUpdtPnttm: '',
          lastUpdusrId: '',
        },
      ],
    });

    const items = await listPlatformMenus();

    expect(items[0].menuId).toBe('101');
    expect(items[0].parentMenuId).toBe('100');
  });

  it('parses ResultVO items response for menu list', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          items: [
            {
              menuId: 'MENU_101',
              menuCode: 'MENU_PLAN_MANAGEMENT',
              menuNm: '플랜 관리',
              menuDc: '플랜 관리 메뉴',
              parentMenuId: 'MENU_PLATFORM_ROOT',
              menuOrdr: 2,
              menuUrl: '/platform/plans',
              iconNm: 'Folder',
              useAt: 'Y',
              frstRegistPnttm: '',
              frstRegisterId: '',
              lastUpdtPnttm: '',
              lastUpdusrId: '',
            },
          ],
        },
      },
    });

    const items = await listPlatformMenus();

    expect(items).toHaveLength(1);
    expect(items[0].menuCode).toBe('MENU_PLAN_MANAGEMENT');
  });

  it('calls the common menu endpoint without platform menu permissions', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          menuId: 'MENU_1',
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
      ],
    });

    const items = await listCommonPlatformMenus();

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/platform-admin/menus/common',
    );
    expect(items[0].menuCode).toBe('MENU_AUTHORITY_MANAGEMENT');
  });

  it('sends parentMenuId when creating menu', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

    await createPlatformMenu({
      menuCode: 'menu_new_code',
      menuNm: '신규 메뉴',
      menuDc: '설명',
      menuUrl: '/platform/new-menu',
      parentMenuId: '100',
      menuOrdr: 5,
      iconNm: 'Menu',
      useAt: 'Y',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v1/platform-admin/menus', {
      menuCode: 'MENU_NEW_CODE',
      menuNm: '신규 메뉴',
      menuDc: '설명',
      menuUrl: '/platform/new-menu',
      parentMenuId: '100',
      menuOrdr: 5,
      iconNm: 'Menu',
      useAt: 'Y',
    });
  });

  it('updates menu by numeric menuId and parentMenuId', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: {} });

    await updatePlatformMenu({
      menuId: '101',
      menuNm: '메뉴 관리(수정)',
      menuDc: '설명',
      menuUrl: '/platform/menus',
      parentMenuId: '100',
      menuOrdr: 10,
      iconNm: 'Settings',
      useAt: 'Y',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/v1/platform-admin/menus/101',
      {
        menuNm: '메뉴 관리(수정)',
        menuDc: '설명',
        menuUrl: '/platform/menus',
        parentMenuId: '100',
        menuOrdr: 10,
        iconNm: 'Settings',
        useAt: 'Y',
      },
    );
  });
});
