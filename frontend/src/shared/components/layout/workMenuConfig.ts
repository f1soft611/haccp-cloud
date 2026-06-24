import { APP_LABELS } from '../../constants/labels';
import type { UserRole } from '../../store/authStore';

export type MenuIconName =
  | 'Dashboard'
  | 'Settings'
  | 'Menu'
  | 'Factory'
  | 'AdminPanelSettings'
  | 'Business'
  | 'People'
  | 'Assignment'
  | 'Inventory'
  | 'Build'
  | 'Category'
  | 'Security'
  | 'Link'
  | 'History'
  | 'AccessTime';

export type MenuItem = {
  label: string;
  description?: string;
  path: string;
  roles: UserRole[];
  icon?: MenuIconName;
};

export type MenuGroup = {
  key: string;
  label: string;
  roles: UserRole[];
  items: MenuItem[];
};

export type AccessibleMenuHierarchyMeta = {
  menuId?: number;
  parentMenuId?: number | null;
  menuCode?: string;
  menuNm?: string;
  menuDc?: string;
  path: string;
  iconNm?: string;
  menuOrdr?: number;
};

const MENU_ICON_NAMES: MenuIconName[] = [
  'Dashboard',
  'Settings',
  'Menu',
  'Factory',
  'AdminPanelSettings',
  'Business',
  'People',
  'Assignment',
  'Inventory',
  'Build',
  'Category',
  'Security',
  'Link',
  'History',
  'AccessTime',
];

const MENU_ICON_NAME_SET = new Set<MenuIconName>(MENU_ICON_NAMES);

export function toMenuIconName(iconName?: string): MenuIconName | undefined {
  if (!iconName) {
    return undefined;
  }

  const normalized = iconName.trim();
  if (MENU_ICON_NAME_SET.has(normalized as MenuIconName)) {
    return normalized as MenuIconName;
  }

  return undefined;
}

const PLATFORM_ADMIN_MENU_GROUPS: MenuGroup[] = [
  {
    key: 'dashboard-management',
    label: APP_LABELS.menu.dashboardGroup,
    roles: ['PLATFORM_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.dashboard,
        description: '운영 현황과 주요 지표를 확인합니다.',
        path: '/dashboard',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Dashboard',
      },
    ],
  },
  {
    key: 'platform-management',
    label: APP_LABELS.menu.platformGroup,
    roles: ['PLATFORM_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.platformFactoryManagement,
        description: '업체 코드 발급과 플랫폼 관리 대상을 운영합니다.',
        path: '/platform/tenants',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Business',
      },
      {
        label: APP_LABELS.menu.platformPlanManagement,
        description: '플랜별 메뉴 매핑과 기능 설정을 조회하고 관리합니다.',
        path: '/platform/plans',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Settings',
      },
      {
        label: APP_LABELS.menu.platformMenuManagement,
        description: '시스템 메뉴를 등록하고 정렬 순서를 관리합니다.',
        path: '/platform/menus',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Menu',
      },
      {
        label: APP_LABELS.menu.platformRoleManagement,
        description: '권한 등록과 상태 관리를 통합 관리합니다.',
        path: '/platform/roles',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Security',
      },
      {
        label: APP_LABELS.menu.platformRoleMenuManagement,
        description: '권한별 메뉴 매핑을 관리합니다.',
        path: '/platform/role-menus',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Link',
      },
      {
        label: APP_LABELS.menu.loginHistory,
        description: '관리자 및 사용자 로그인 이력을 조회합니다.',
        path: '/platform/login-history',
        roles: ['PLATFORM_ADMIN'],
        icon: 'AccessTime',
      },
    ],
  },
  {
    key: 'document-management',
    label: APP_LABELS.menu.documentGroup,
    roles: ['PLATFORM_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.documents,
        description: '업체 문서 템플릿을 조회하고 관리합니다.',
        path: '/documents',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Assignment',
      },
      {
        label: APP_LABELS.menu.history,
        description: '업체 문서 변경 이력을 조회합니다.',
        path: '/document-history',
        roles: ['PLATFORM_ADMIN'],
        icon: 'History',
      },
    ],
  },
  {
    key: 'system-management',
    label: APP_LABELS.menu.systemGroup,
    roles: ['PLATFORM_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.users,
        description: '업체 사용자 계정과 권한을 관리합니다.',
        path: '/users',
        roles: ['PLATFORM_ADMIN'],
        icon: 'People',
      },
      {
        label: APP_LABELS.menu.departments,
        description: '업체 부서 정보를 등록하고 수정합니다.',
        path: '/departments',
        roles: ['PLATFORM_ADMIN'],
        icon: 'Category',
      },
      {
        label: APP_LABELS.menu.loginHistory,
        description: '관리자 및 사용자 로그인 이력을 조회합니다.',
        path: '/platform/login-history',
        roles: ['PLATFORM_ADMIN'],
        icon: 'AccessTime',
      },
    ],
  },
];

const TENANT_ADMIN_MENU_GROUPS: MenuGroup[] = [
  {
    key: 'tenant-work',
    label: APP_LABELS.menu.dashboard,
    roles: ['TENANT_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.dashboard,
        description: '업체 운영 현황과 점검 상태를 확인합니다.',
        path: '/dashboard',
        roles: ['TENANT_ADMIN'],
        icon: 'Dashboard',
      },
      {
        label: APP_LABELS.menu.users,
        description: '사용자 계정과 권한을 관리합니다.',
        path: '/users',
        roles: ['TENANT_ADMIN'],
        icon: 'People',
      },
      {
        label: APP_LABELS.menu.departments,
        description: '부서 정보를 등록하고 수정합니다.',
        path: '/departments',
        roles: ['TENANT_ADMIN'],
        icon: 'Category',
      },
      {
        label: APP_LABELS.menu.documents,
        description: '문서 템플릿을 조회하고 관리합니다.',
        path: '/documents',
        roles: ['TENANT_ADMIN'],
        icon: 'Assignment',
      },
      {
        label: APP_LABELS.menu.history,
        description: '문서 변경 이력을 확인합니다.',
        path: '/document-history',
        roles: ['TENANT_ADMIN'],
        icon: 'History',
      },
    ],
  },
];

const USER_MENU_GROUPS: MenuGroup[] = [
  {
    key: 'user-work',
    label: APP_LABELS.menu.dashboard,
    roles: ['USER'],
    items: [
      {
        label: APP_LABELS.menu.dashboard,
        description: '내 업무 현황을 한눈에 확인합니다.',
        path: '/dashboard',
        roles: ['USER'],
        icon: 'Dashboard',
      },
      {
        label: APP_LABELS.menu.documents,
        description: '문서 목록을 조회하고 작업합니다.',
        path: '/documents',
        roles: ['USER'],
        icon: 'Assignment',
      },
      {
        label: APP_LABELS.menu.history,
        description: '내가 처리한 문서 이력을 확인합니다.',
        path: '/document-history',
        roles: ['USER'],
        icon: 'History',
      },
    ],
  },
];

const WORK_MENU_GROUPS_BY_ROLE: Record<UserRole, MenuGroup[]> = {
  PLATFORM_ADMIN: PLATFORM_ADMIN_MENU_GROUPS,
  TENANT_ADMIN: TENANT_ADMIN_MENU_GROUPS,
  USER: USER_MENU_GROUPS,
};

export function getWorkMenuGroups(role: UserRole): MenuGroup[] {
  return WORK_MENU_GROUPS_BY_ROLE[role] ?? USER_MENU_GROUPS;
}

export function filterWorkMenuGroupsByPaths(
  menuGroups: MenuGroup[],
  accessiblePaths: string[],
): MenuGroup[] {
  const allowedPathSet = new Set(accessiblePaths);

  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedPathSet.has(item.path)),
    }))
    .filter((group) => group.items.length > 0);
}

function toSortedMenus(menus: AccessibleMenuHierarchyMeta[]) {
  return [...menus].sort((a, b) => {
    const orderA = a.menuOrdr ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.menuOrdr ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (
      (a.menuId ?? Number.MAX_SAFE_INTEGER) -
      (b.menuId ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function buildMenuGroupsFromAccessibleMenus(
  role: UserRole,
  menus: AccessibleMenuHierarchyMeta[],
  accessiblePaths: string[],
): MenuGroup[] {
  if (menus.length === 0) {
    return [];
  }

  const roots = toSortedMenus(menus).filter(
    (menu) => menu.parentMenuId == null,
  );

  const allowedPathSet = new Set(accessiblePaths);
  const childrenByParentId = new Map<number, AccessibleMenuHierarchyMeta[]>();

  menus.forEach((menu) => {
    if (menu.parentMenuId == null) {
      return;
    }

    const list = childrenByParentId.get(menu.parentMenuId) ?? [];
    list.push(menu);
    childrenByParentId.set(menu.parentMenuId, list);
  });

  if (roots.length === 0) {
    const items: MenuItem[] = toSortedMenus(menus)
      .filter((menu) => menu.path.length > 0 && allowedPathSet.has(menu.path))
      .map((menu) => ({
        label: menu.menuNm || menu.path,
        description: menu.menuDc,
        path: menu.path,
        roles: [role],
        icon: toMenuIconName(menu.iconNm),
      }));

    if (items.length === 0) {
      return [];
    }

    return [
      {
        key: 'menu-group-fallback',
        label: APP_LABELS.menu.dashboard,
        roles: [role],
        items,
      },
    ];
  }

  return roots
    .map((root): MenuGroup | null => {
      const directChildren =
        root.menuId == null
          ? []
          : toSortedMenus(childrenByParentId.get(root.menuId) ?? []);

      const items: MenuItem[] = directChildren
        .filter(
          (child) => child.path.length > 0 && allowedPathSet.has(child.path),
        )
        .map((child) => ({
          label: child.menuNm || child.path,
          description: child.menuDc,
          path: child.path,
          roles: [role],
          icon: toMenuIconName(child.iconNm),
        }));

      if (
        items.length === 0 &&
        root.path.length > 0 &&
        allowedPathSet.has(root.path)
      ) {
        items.push({
          label: root.menuNm || root.path,
          description: root.menuDc,
          path: root.path,
          roles: [role],
          icon: toMenuIconName(root.iconNm),
        });
      }

      if (items.length === 0) {
        return null;
      }

      return {
        key:
          root.menuCode ||
          (root.menuId != null
            ? `menu-group-${root.menuId}`
            : `menu-group-${root.path}`),
        label: root.menuNm || root.path || APP_LABELS.menu.dashboard,
        roles: [role],
        items,
      };
    })
    .filter((group): group is MenuGroup => group !== null);
}

export const WORK_MENU_ITEMS: MenuItem[] = [
  {
    label: APP_LABELS.menu.dashboard,
    path: '/dashboard',
    roles: ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'],
    icon: 'Dashboard',
  },
  {
    label: APP_LABELS.menu.platformMenuManagement,
    path: '/platform/menus',
    roles: ['PLATFORM_ADMIN'],
    icon: 'Menu',
  },
  {
    label: APP_LABELS.menu.platformPlanManagement,
    path: '/platform/plans',
    roles: ['PLATFORM_ADMIN'],
    icon: 'Settings',
  },
  {
    label: APP_LABELS.menu.platformRoleManagement,
    path: '/platform/roles',
    roles: ['PLATFORM_ADMIN'],
    icon: 'Security',
  },
  {
    label: APP_LABELS.menu.onboarding,
    path: '/platform/onboarding',
    roles: ['PLATFORM_ADMIN'],
    icon: 'Business',
  },
  {
    label: APP_LABELS.menu.loginHistory,
    path: '/platform/login-history',
    roles: ['PLATFORM_ADMIN'],
    icon: 'AccessTime',
  },
  {
    label: APP_LABELS.menu.users,
    path: '/users',
    roles: ['TENANT_ADMIN'],
    icon: 'People',
  },
  {
    label: APP_LABELS.menu.departments,
    path: '/departments',
    roles: ['TENANT_ADMIN'],
    icon: 'Category',
  },
  {
    label: APP_LABELS.menu.documents,
    path: '/documents',
    roles: ['TENANT_ADMIN', 'USER'],
    icon: 'Assignment',
  },
  {
    label: APP_LABELS.menu.history,
    path: '/document-history',
    roles: ['TENANT_ADMIN', 'USER'],
    icon: 'History',
  },
];
