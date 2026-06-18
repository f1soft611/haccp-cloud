import { apiClient } from '../api/apiClient';
import type { AuthorityCode } from '../../shared/auth/authorityCode';

type UserMenuEntry = {
  menuUrl?: string | null;
};

type UserMenuEnvelope = {
  result?: {
    menuList?: UserMenuEntry[];
  };
  menuList?: UserMenuEntry[];
};

function normalizeMenuPath(menuUrl: string): string {
  const trimmed = menuUrl.trim();
  if (trimmed.length === 0 || trimmed === '/') {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/\/+$/, '');

  // Keep backward compatibility while platform onboarding moves to the new route.
  if (normalizedPath === '/onboarding') {
    return '/platform/onboarding';
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
    `/admin/user-menus/${normalizedAuthorityCode}`,
  );

  const menuList = data.result?.menuList ?? data.menuList ?? [];
  const menuPaths = menuList
    .map((item) => item.menuUrl ?? '')
    .map((menuUrl) => normalizeMenuPath(menuUrl))
    .filter((menuUrl) => menuUrl.length > 0);

  return Array.from(new Set(menuPaths));
}
