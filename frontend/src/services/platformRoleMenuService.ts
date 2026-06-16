import { apiClient } from './apiClient';

export type PlatformRoleMenuMapping = {
  roleCode: string;
  menuIds: string[];
};

export async function getPlatformRoleMenuMapping(
  roleCode: string,
): Promise<PlatformRoleMenuMapping> {
  const { data } = await apiClient.get<PlatformRoleMenuMapping>(
    '/platform-admin/role-menus',
    { params: { roleCode } },
  );
  return data;
}

export async function savePlatformRoleMenuMapping(payload: {
  roleCode: string;
  menuIds: string[];
}): Promise<PlatformRoleMenuMapping> {
  const { data } = await apiClient.put<PlatformRoleMenuMapping>(
    `/platform-admin/role-menus/${payload.roleCode}`,
    { menuIds: payload.menuIds },
  );
  return data;
}
