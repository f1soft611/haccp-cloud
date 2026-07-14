import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

export type PlatformRoleMenuMapping = {
  roleCode: string;
  menuIds: string[];
};

type RoleMenuItemResult = {
  item?: PlatformRoleMenuMapping;
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
        .map((menuId) => menuId.trim())
        .filter((menuId) => menuId.length > 0),
    ),
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
        tenantCode: tenantCode?.trim().toUpperCase(),
      },
    },
  );
  const item = data?.result?.item;
  return {
    roleCode: normalizeRoleCode(item?.roleCode ?? normalizedRoleCode),
    menuIds: normalizeMenuIds(item?.menuIds ?? []),
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
        tenantCode: payload.tenantCode?.trim().toUpperCase(),
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
  const normalizedTenantCode = tenantCode.trim().toUpperCase();
  const { data } = await apiClient.get<
    ResultEnvelope<RoleMenuCandidatesResult>
  >('/v1/platform-admin/role-menu-candidates', {
    params: { tenantCode: normalizedTenantCode },
  });

  return normalizeMenuIds(data?.result?.item?.menuCodes ?? []);
}
