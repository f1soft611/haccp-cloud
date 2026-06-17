import { apiClient } from '../api/apiClient';

export type PlatformRoleItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
};

export type CreatePlatformRoleRequest = {
  code: string;
  name: string;
  description: string;
  active: boolean;
};

export type UpdatePlatformRoleRequest = {
  id: string;
  active: boolean;
};

export async function listPlatformRoles(): Promise<PlatformRoleItem[]> {
  const { data } = await apiClient.get<PlatformRoleItem[]>(
    '/platform-admin/roles',
  );
  return data;
}

export async function createPlatformRole(
  payload: CreatePlatformRoleRequest,
): Promise<PlatformRoleItem> {
  const { data } = await apiClient.post<PlatformRoleItem>(
    '/platform-admin/roles',
    payload,
  );
  return data;
}

export async function updatePlatformRoleStatus(
  payload: UpdatePlatformRoleRequest,
): Promise<PlatformRoleItem> {
  const { data } = await apiClient.patch<PlatformRoleItem>(
    `/platform-admin/roles/${payload.id}`,
    { active: payload.active },
  );
  return data;
}
