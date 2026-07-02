import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listAccessibleMenuPaths,
  listAccessibleMenus,
} from '../services/platform-admin/platformUserMenuService';
import { apiClient } from '../services/api/apiClient';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('platformUserMenuService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses direct array response for accessible menu paths', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValue({
      data: [
        {
          menuUrl: '/platform/tenants',
        },
        {
          menuUrl: '/platform/menus',
        },
      ],
    });

    const paths = await listAccessibleMenuPaths();

    expect(paths).toEqual(['/platform/tenants', '/platform/menus']);
  });

  it('filters non-routable group root paths from accessible menu paths', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValue({
      data: [
        {
          menuUrl: '/org',
        },
        {
          menuUrl: '/org/users',
        },
        {
          menuUrl: '/documents',
        },
      ],
    });

    const paths = await listAccessibleMenuPaths();

    expect(paths).toEqual(['/org/users', '/documents']);
  });

  it('normalizes legacy organization menu paths to /org routes', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValue({
      data: [
        {
          menuUrl: '/users',
        },
        {
          menuUrl: '/departments',
        },
        {
          menuUrl: '/roles',
        },
      ],
    });

    const paths = await listAccessibleMenuPaths();

    expect(paths).toEqual(['/org/users', '/org/departments', '/org/roles']);
  });

  it('parses direct array response for accessible menu metadata', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValue({
      data: [
        {
          menuUrl: '/platform/login-history',
          menuNm: '로그인 이력 관리',
          menuDc: '시스템 사용자 로그인 이력을 관리한다.',
          iconNm: 'People',
        },
      ],
    });

    const menus = await listAccessibleMenus();

    expect(menus).toEqual([
      {
        menuId: undefined,
        parentMenuId: null,
        menuCode: undefined,
        menuOrdr: undefined,
        path: '/platform/login-history',
        menuNm: '로그인 이력 관리',
        menuDc: '시스템 사용자 로그인 이력을 관리한다.',
        iconNm: 'People',
      },
    ]);
  });
});
