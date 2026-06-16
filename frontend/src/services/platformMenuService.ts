import { apiClient } from './apiClient';
import type { UserRole } from '../shared/store/authStore';

export type PlatformMenuItem = {
  id: string;
  name: string;
  path: string;
  sortOrder: number;
  active: boolean;
  roles: UserRole[];
  updatedBy: string;
  updatedAt: string;
};

export type CreatePlatformMenuRequest = {
  name: string;
  path: string;
  sortOrder: number;
  active: boolean;
  roles: UserRole[];
};

export type UpdatePlatformMenuRequest = {
  id: string;
  active: boolean;
};

export async function listPlatformMenus(): Promise<PlatformMenuItem[]> {
  const { data } = await apiClient.get<PlatformMenuItem[]>(
    '/platform-admin/menus',
  );
  return data;
}

export async function createPlatformMenu(
  payload: CreatePlatformMenuRequest,
): Promise<PlatformMenuItem> {
  const { data } = await apiClient.post<PlatformMenuItem>(
    '/platform-admin/menus',
    payload,
  );
  return data;
}

export async function updatePlatformMenuStatus(
  payload: UpdatePlatformMenuRequest,
): Promise<PlatformMenuItem> {
  const { data } = await apiClient.patch<PlatformMenuItem>(
    `/platform-admin/menus/${payload.id}`,
    { active: payload.active },
  );
  return data;
}
