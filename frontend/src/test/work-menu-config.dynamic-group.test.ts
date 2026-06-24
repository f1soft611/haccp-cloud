import { describe, expect, it } from 'vitest';
import {
  buildMenuGroupsFromAccessibleMenus,
  type MenuGroup,
} from '../shared/components/layout/workMenuConfig';

type AccessibleMenuMeta = {
  menuId?: number;
  parentMenuId?: number | null;
  menuCode?: string;
  menuNm?: string;
  menuDc?: string;
  path: string;
  iconNm?: string;
  menuOrdr?: number;
};

describe('buildMenuGroupsFromAccessibleMenus', () => {
  it('builds grouped menus from root and child rows', () => {
    const menus: AccessibleMenuMeta[] = [
      {
        menuId: 100,
        parentMenuId: null,
        menuCode: 'MENU_PLATFORM_ROOT',
        menuNm: '플랫폼 관리',
        path: '/platform',
        menuOrdr: 1,
      },
      {
        menuId: 110,
        parentMenuId: 100,
        menuCode: 'MENU_TENANT_MGMT',
        menuNm: '업체 관리',
        path: '/platform/tenants',
        menuOrdr: 1,
      },
      {
        menuId: 120,
        parentMenuId: 100,
        menuCode: 'MENU_ROLE_MGMT',
        menuNm: '권한 관리',
        path: '/platform/roles',
        menuOrdr: 2,
      },
      {
        menuId: 200,
        parentMenuId: null,
        menuCode: 'MENU_DOC_ROOT',
        menuNm: '문서 관리',
        path: '/documents',
        menuOrdr: 2,
      },
      {
        menuId: 210,
        parentMenuId: 200,
        menuCode: 'MENU_DOC_HISTORY',
        menuNm: '문서 이력',
        path: '/document-history',
        menuOrdr: 1,
      },
    ];

    const groups = buildMenuGroupsFromAccessibleMenus('PLATFORM_ADMIN', menus, [
      '/platform/tenants',
      '/platform/roles',
      '/document-history',
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.label)).toEqual([
      '플랫폼 관리',
      '문서 관리',
    ]);

    expect(groups[0].items.map((item) => item.path)).toEqual([
      '/platform/tenants',
      '/platform/roles',
    ]);
    expect(groups[1].items.map((item) => item.path)).toEqual([
      '/document-history',
    ]);
  });

  it('creates a single-item group for a root menu without children', () => {
    const menus: AccessibleMenuMeta[] = [
      {
        menuId: 10,
        parentMenuId: null,
        menuCode: 'MENU_DASHBOARD',
        menuNm: '대시보드',
        path: '/dashboard',
        menuOrdr: 1,
      },
    ];

    const groups: MenuGroup[] = buildMenuGroupsFromAccessibleMenus(
      'TENANT_ADMIN',
      menus,
      ['/dashboard'],
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('대시보드');
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].items[0].path).toBe('/dashboard');
  });
});
