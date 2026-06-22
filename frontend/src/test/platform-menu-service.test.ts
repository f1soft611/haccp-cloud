import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  createPlatformMenu,
  listPlatformMenus,
  listPlatformMenusPaged,
  updatePlatformMenu,
} from '../services/platform/platformMenuService';

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

    expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/menus/paged', {
      params: {
        pageIndex: 2,
        pageSize: 10,
        searchField: 'menuNm',
        searchKeyword: '관리',
        useAt: 'Y',
      },
    });
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

  it('sends parentMenuId when creating menu', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

    await createPlatformMenu({
      menuNm: '신규 메뉴',
      menuDc: '설명',
      menuUrl: '/platform/new-menu',
      parentMenuId: '100',
      menuOrdr: 5,
      iconNm: 'Menu',
      useAt: 'Y',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/platform-admin/menus', {
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

    expect(apiClient.patch).toHaveBeenCalledWith('/platform-admin/menus/101', {
      menuNm: '메뉴 관리(수정)',
      menuDc: '설명',
      menuUrl: '/platform/menus',
      parentMenuId: '100',
      menuOrdr: 10,
      iconNm: 'Settings',
      useAt: 'Y',
    });
  });
});
