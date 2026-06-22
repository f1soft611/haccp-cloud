import { apiClient } from '../api/apiClient';
import type { AuthorityCode } from '../../shared/auth/authorityCode';

type UserMenuEntry = {
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

export type AccessibleMenuMeta = {
  path: string;
  menuNm?: string;
  menuDc?: string;
  iconNm?: string;
};

function normalizeMenuPath(menuUrl: string): string {
  const trimmed = menuUrl.trim();
  if (trimmed.length === 0 || trimmed === '/') {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/\/+$/, '');

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

function normalizeAuthorityCode(authorityCode: string): AuthorityCode {
  const normalized = authorityCode.trim().toUpperCase();

  if (normalized === 'PLATFORM_ADMIN') {
    return 'PLATFORM_ADMIN';
  }

  if (normalized === 'TENANT_ADMIN') {
    return 'TENANT_ADMIN';
  }

  return 'TENANT_USER';
}

export async function listAccessibleMenuPaths(
  authorityCode: string,
): Promise<string[]> {
  const normalizedAuthorityCode = normalizeAuthorityCode(authorityCode);

  const { data } = await apiClient.get<UserMenuEnvelope>(
    `/platform-admin/user-menus/${normalizedAuthorityCode}`,
  );

  const menuList = data.result?.menuList ?? data.menuList ?? [];
  const menuPaths = menuList
    .map((item) => (typeof item === 'string' ? item : (item.menuUrl ?? '')))
    .map((menuUrl) => normalizeMenuPath(menuUrl))
    .filter((menuUrl) => menuUrl.length > 0);

  return Array.from(new Set(menuPaths));
}

export async function listAccessibleMenus(
  authorityCode: string,
): Promise<AccessibleMenuMeta[]> {
  const normalizedAuthorityCode = normalizeAuthorityCode(authorityCode);

  const { data } = await apiClient.get<UserMenuEnvelope>(
    `/platform-admin/user-menus/${normalizedAuthorityCode}`,
  );

  const menuList = data.result?.menuList ?? data.menuList ?? [];
  const normalizedMenus = menuList
    .map((item) => {
      if (typeof item === 'string') {
        return {
          path: normalizeMenuPath(item),
          menuNm: undefined,
          menuDc: undefined,
          iconNm: undefined,
        };
      }

      return {
        path: normalizeMenuPath(item.menuUrl ?? ''),
        menuNm: item.menuNm?.trim(),
        menuDc: item.menuDc?.trim(),
        iconNm: item.iconNm?.trim(),
      };
    })
    .filter((item) => item.path.length > 0);

  const uniqueByPath = new Map<string, AccessibleMenuMeta>();
  normalizedMenus.forEach((item) => {
    if (!uniqueByPath.has(item.path)) {
      uniqueByPath.set(item.path, item);
      return;
    }

    const current = uniqueByPath.get(item.path);
    if (!current) {
      uniqueByPath.set(item.path, item);
      return;
    }

    // Keep the first non-empty menu label/description for each path.
    uniqueByPath.set(item.path, {
      path: item.path,
      menuNm: current.menuNm || item.menuNm,
      menuDc: current.menuDc || item.menuDc,
      iconNm: current.iconNm || item.iconNm,
    });
  });

  return Array.from(uniqueByPath.values());
}
