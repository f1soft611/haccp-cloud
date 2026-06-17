import { APP_LABELS } from '../../constants/labels';
import type { MenuItem } from './WorkMenuBar';
import type { UserRole } from '../../store/authStore';

export type MenuGroup = {
  key: string;
  label: string;
  roles: UserRole[];
  items: MenuItem[];
};

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
      },
    ],
  },
  {
    key: 'system-management',
    label: APP_LABELS.menu.systemGroup,
    roles: ['PLATFORM_ADMIN'],
    items: [
      {
        label: APP_LABELS.menu.platformMenuManagement,
        description: '시스템 메뉴를 등록하고 정렬 순서를 관리합니다.',
        path: '/platform/menus',
        roles: ['PLATFORM_ADMIN'],
      },
      {
        label: APP_LABELS.menu.platformRoleManagement,
        description: '권한 코드를 등록하고 활성 상태를 관리합니다.',
        path: '/platform/roles',
        roles: ['PLATFORM_ADMIN'],
      },
      {
        label: APP_LABELS.menu.platformRoleMenuManagement,
        description: '권한별 메뉴 노출 매핑을 설정합니다.',
        path: '/platform/role-menus',
        roles: ['PLATFORM_ADMIN'],
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
      },
      {
        label: APP_LABELS.menu.users,
        description: '사용자 계정과 권한을 관리합니다.',
        path: '/users',
        roles: ['TENANT_ADMIN'],
      },
      {
        label: APP_LABELS.menu.departments,
        description: '부서 정보를 등록하고 수정합니다.',
        path: '/departments',
        roles: ['TENANT_ADMIN'],
      },
      {
        label: APP_LABELS.menu.documents,
        description: '문서 템플릿을 조회하고 관리합니다.',
        path: '/documents',
        roles: ['TENANT_ADMIN'],
      },
      {
        label: APP_LABELS.menu.history,
        description: '문서 변경 이력을 확인합니다.',
        path: '/document-history',
        roles: ['TENANT_ADMIN'],
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
      },
      {
        label: APP_LABELS.menu.documents,
        description: '문서 목록을 조회하고 작업합니다.',
        path: '/documents',
        roles: ['USER'],
      },
      {
        label: APP_LABELS.menu.history,
        description: '내가 처리한 문서 이력을 확인합니다.',
        path: '/document-history',
        roles: ['USER'],
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

export const WORK_MENU_ITEMS: MenuItem[] = [
  {
    label: APP_LABELS.menu.dashboard,
    path: '/dashboard',
    roles: ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.platformMenuManagement,
    path: '/platform/menus',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.platformRoleManagement,
    path: '/platform/roles',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.platformRoleMenuManagement,
    path: '/platform/role-menus',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.onboarding,
    path: '/onboarding',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.loginHistory,
    path: '/login-history',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.users,
    path: '/users',
    roles: ['TENANT_ADMIN'],
  },
  {
    label: APP_LABELS.menu.departments,
    path: '/departments',
    roles: ['TENANT_ADMIN'],
  },
  {
    label: APP_LABELS.menu.documents,
    path: '/documents',
    roles: ['TENANT_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.history,
    path: '/document-history',
    roles: ['TENANT_ADMIN', 'USER'],
  },
];
