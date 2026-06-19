import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { listPlatformMenusPaged } from '../services/platform/platformMenuService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
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
});
