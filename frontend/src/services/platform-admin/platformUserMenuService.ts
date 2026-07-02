import { apiClient } from '../api/apiClient';

type UserMenuEntry = {
  menuId?: number | null;
  parentMenuId?: number | null;
  menuCode?: string | null;
  menuOrdr?: number | null;
  menuUrl?: string | null;
  menuNm?: string | null;
  menuDc?: string | null;
  iconNm?: string | null;
};

type UserMenuListEntry = UserMenuEntry | string;

type UserMenuEnvelope = {
  result?: {
    menuList?: UserMenuListEntry[];
  };
  menuList?: UserMenuListEntry[];
};

type UserMenuResponse = UserMenuEnvelope | UserMenuListEntry[];

export type AccessibleMenuMeta = {
  menuId?: number;
  parentMenuId?: number | null;
  menuCode?: string;
  menuOrdr?: number;
  path: string;
  menuNm?: string;
  menuDc?: string;
  iconNm?: string;
};

function mergeMenuMeta(
  current: AccessibleMenuMeta,
  incoming: AccessibleMenuMeta,
): AccessibleMenuMeta {
  return {
    menuId: current.menuId ?? incoming.menuId,
    parentMenuId: current.parentMenuId ?? incoming.parentMenuId ?? null,
    menuCode: current.menuCode ?? incoming.menuCode,
    menuOrdr: current.menuOrdr ?? incoming.menuOrdr,
    path: current.path || incoming.path,
    menuNm: current.menuNm || incoming.menuNm,
    menuDc: current.menuDc || incoming.menuDc,
    iconNm: current.iconNm || incoming.iconNm,
  };
}

function normalizeMenuPath(menuUrl: string): string {
  const trimmed = menuUrl.trim();
  if (trimmed.length === 0 || trimmed === '/') {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/\/+$/, '');

  if (normalizedPath === '/org') {
    return '';
  }

  if (normalizedPath === '/users') {
    return '/org/users';
  }

  if (normalizedPath === '/departments') {
    return '/org/departments';
  }

  if (normalizedPath === '/roles') {
    return '/org/roles';
  }

  // Keep backward compatibility while platform onboarding moves to tenant management list.
  if (
    normalizedPath === '/onboarding' ||
    normalizedPath === '/platform/onboarding'
  ) {
    return '/platform/tenants';
  }

  if (normalizedPath === '/login-history') {
    return '/platform/login-history';
  }

  return normalizedPath;
}

function extractUserMenuList(data: UserMenuResponse): UserMenuListEntry[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.result?.menuList ?? data.menuList ?? [];
}

export async function listAccessibleMenuPaths(): Promise<string[]> {
  const { data } = await apiClient.get<UserMenuResponse>(
    '/platform-admin/user-menus/me',
  );

  const menuList = extractUserMenuList(data);
  const menuPaths = menuList
    .map((item) => (typeof item === 'string' ? item : (item.menuUrl ?? '')))
    .map((menuUrl) => normalizeMenuPath(menuUrl))
    .filter((menuUrl) => menuUrl.length > 0);

  return Array.from(new Set(menuPaths));
}

export async function listAccessibleMenus(): Promise<AccessibleMenuMeta[]> {
  const { data } = await apiClient.get<UserMenuResponse>(
    '/platform-admin/user-menus/me',
  );

  const menuList = extractUserMenuList(data);
  const normalizedMenus = menuList
    .map((item) => {
      if (typeof item === 'string') {
        return {
          menuId: undefined,
          parentMenuId: null,
          menuCode: undefined,
          menuOrdr: undefined,
          path: normalizeMenuPath(item),
          menuNm: undefined,
          menuDc: undefined,
          iconNm: undefined,
        };
      }

      return {
        menuId: item.menuId ?? undefined,
        parentMenuId: item.parentMenuId ?? null,
        menuCode: item.menuCode?.trim() || undefined,
        menuOrdr: item.menuOrdr ?? undefined,
        path: normalizeMenuPath(item.menuUrl ?? ''),
        menuNm: item.menuNm?.trim(),
        menuDc: item.menuDc?.trim(),
        iconNm: item.iconNm?.trim(),
      };
    })
    .filter(
      (item) => item.path.length > 0 || item.menuId != null || !!item.menuCode,
    );

  const uniqueMenus = new Map<string, AccessibleMenuMeta>();
  normalizedMenus.forEach((item) => {
    const key =
      item.menuId != null
        ? `id:${item.menuId}`
        : item.menuCode
          ? `code:${item.menuCode}`
          : `path:${item.parentMenuId ?? 'root'}:${item.path}`;

    const current = uniqueMenus.get(key);
    if (!current) {
      uniqueMenus.set(key, item);
      return;
    }

    uniqueMenus.set(key, mergeMenuMeta(current, item));
  });

  return Array.from(uniqueMenus.values());
}
