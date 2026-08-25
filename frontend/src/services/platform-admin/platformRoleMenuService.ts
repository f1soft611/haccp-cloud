import { apiClient } from '../api/apiClient';
import { normalizePlatformTenantCode } from '../../shared/tenant/platformTenant';

type ResultEnvelope<T> = {
  result?: T;
};

export type PlatformRoleMenuMapping = {
  roleCode: string;
  menuIds: string[];
};

type RoleMenuItemResult = {
  item?: PlatformRoleMenuMapping & {
    menuCodes?: string[];
  };
};

type RoleMenuCandidatesResult = {
  item?: {
    menuCodes?: string[];
  };
};

function normalizeRoleCode(roleCode: string): string {
  return roleCode.trim().toUpperCase();
}

function normalizeMenuIds(menuIds: string[]): string[] {
  return Array.from(
    new Set(
      menuIds
        .map((menuId) => menuId.trim().toUpperCase())
        .filter((menuId) => menuId.length > 0),
    ),
  );
}

function normalizeMenuCodes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeMenuIds(
    value.filter((entry): entry is string => typeof entry === 'string'),
  );
}

export async function getPlatformRoleMenuMapping(
  roleCode: string,
  tenantCode?: string,
): Promise<PlatformRoleMenuMapping> {
  const normalizedRoleCode = normalizeRoleCode(roleCode);
  const { data } = await apiClient.get<ResultEnvelope<RoleMenuItemResult>>(
    '/v1/platform-admin/role-menus',
    {
      params: {
        roleCode: normalizedRoleCode,
        tenantCode: normalizePlatformTenantCode(tenantCode),
      },
    },
  );
  const item = data?.result?.item;
  const menuIds = normalizeMenuCodes(item?.menuCodes ?? item?.menuIds ?? []);
  return {
    roleCode: normalizeRoleCode(item?.roleCode ?? normalizedRoleCode),
    menuIds,
  };
}

export async function savePlatformRoleMenuMapping(payload: {
  roleCode: string;
  tenantCode?: string;
  menuIds: string[];
}): Promise<PlatformRoleMenuMapping> {
  const roleCode = normalizeRoleCode(payload.roleCode);
  const menuIds = normalizeMenuIds(payload.menuIds);
  const { data } = await apiClient.put<ResultEnvelope<RoleMenuItemResult>>(
    `/v1/platform-admin/role-menus/${roleCode}`,
    { menuIds },
    {
      params: {
        tenantCode: normalizePlatformTenantCode(payload.tenantCode),
      },
    },
  );
  const item = data?.result?.item;
  return {
    roleCode: normalizeRoleCode(item?.roleCode ?? roleCode),
    menuIds: normalizeMenuIds(item?.menuIds ?? menuIds),
  };
}

export async function listRoleMenuCandidatesByTenant(
  tenantCode: string,
): Promise<string[]> {
  const normalizedTenantCode = normalizePlatformTenantCode(tenantCode);
  const { data } = await apiClient.get<
    ResultEnvelope<RoleMenuCandidatesResult>
  >('/v1/platform-admin/role-menu-candidates', {
    params: { tenantCode: normalizedTenantCode },
  });

  return normalizeMenuIds(data?.result?.item?.menuCodes ?? []);
}
