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
    new Set(menuIds.map((menuId) => menuId.trim()).filter((menuId) => menuId.length > 0)),
  );
}

export async function getPlatformRoleMenuMapping(
  roleCode: string,
): Promise<PlatformRoleMenuMapping> {
  const normalizedRoleCode = normalizeRoleCode(roleCode);
  const { data } = await apiClient.get<PlatformRoleMenuMapping>(
    '/platform-admin/role-menus',
    { params: { roleCode: normalizedRoleCode } },
  );
  return {
    roleCode: normalizeRoleCode(data.roleCode ?? normalizedRoleCode),
    menuIds: normalizeMenuIds(data.menuIds ?? []),
  };
}

export async function savePlatformRoleMenuMapping(payload: {
  roleCode: string;
  menuIds: string[];
}): Promise<PlatformRoleMenuMapping> {
  const roleCode = normalizeRoleCode(payload.roleCode);
  const menuIds = normalizeMenuIds(payload.menuIds);
  const { data } = await apiClient.put<PlatformRoleMenuMapping>(
    `/platform-admin/role-menus/${roleCode}`,
    { menuIds },
  );
  return {
    roleCode: normalizeRoleCode(data.roleCode ?? roleCode),
    menuIds: normalizeMenuIds(data.menuIds ?? menuIds),
  };
}
