import { apiClient } from '../api/apiClient';

export type PlatformRoleMenuMapping = {
  roleCode: string;
  menuIds: string[];
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
  const { data } = await apiClient.get<PlatformRoleMenuMapping>(
    '/platform-admin/role-menus',
    {
      params: {
        roleCode: normalizedRoleCode,
        tenantCode: tenantCode?.trim().toUpperCase(),
      },
    },
  );
  return {
    roleCode: normalizeRoleCode(data.roleCode ?? normalizedRoleCode),
    menuIds: normalizeMenuIds(data.menuIds ?? []),
  };
}

export async function savePlatformRoleMenuMapping(payload: {
  roleCode: string;
  tenantCode?: string;
  menuIds: string[];
}): Promise<PlatformRoleMenuMapping> {
  const roleCode = normalizeRoleCode(payload.roleCode);
  const menuIds = normalizeMenuIds(payload.menuIds);
  const { data } = await apiClient.put<PlatformRoleMenuMapping>(
    `/platform-admin/role-menus/${roleCode}`,
    { menuIds },
    {
      params: {
        tenantCode: payload.tenantCode?.trim().toUpperCase(),
      },
    },
  );
  return {
    roleCode: normalizeRoleCode(data.roleCode ?? roleCode),
    menuIds: normalizeMenuIds(data.menuIds ?? menuIds),
  };
}

export async function listRoleMenuCandidatesByTenant(
  tenantCode: string,
): Promise<string[]> {
  const normalizedTenantCode = tenantCode.trim().toUpperCase();
  const { data } = await apiClient.get<{ menuCodes?: string[] }>(
    '/platform-admin/role-menu-candidates',
    {
      params: { tenantCode: normalizedTenantCode },
    },
  );

  return normalizeMenuIds(data.menuCodes ?? []);
}
