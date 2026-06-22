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
    key: 'system-management',
    label: APP_LABELS.menu.systemGroup,
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
