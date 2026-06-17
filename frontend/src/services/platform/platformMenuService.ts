import { apiClient } from '../api/apiClient';

export type PlatformMenuItem = {
  menuId: string;
  menuNm: string;
  menuDc: string;
  parentMenuId: string | null;
  menuOrdr: number;
  menuUrl: string;
  iconNm: string;
  useAt: 'Y' | 'N';
  frstRegistPnttm: string;
  frstRegisterId: string;
  lastUpdtPnttm: string;
  lastUpdusrId: string;
  parentMenuNm?: string;
  hasChildren?: boolean;
};

export type CreatePlatformMenuRequest = {
  menuNm: string;
  menuDc: string;
  menuUrl: string;
  parentMenuId: string | null;
  menuOrdr: number;
  iconNm: string;
  useAt: 'Y' | 'N';
};

export type UpdatePlatformMenuRequest = {
  menuId: string;
  menuNm: string;
  menuDc: string;
  menuUrl: string;
  parentMenuId: string | null;
  menuOrdr: number;
  iconNm: string;
  useAt: 'Y' | 'N';
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

export async function updatePlatformMenu(
  payload: UpdatePlatformMenuRequest,
): Promise<PlatformMenuItem> {
  const { data } = await apiClient.patch<PlatformMenuItem>(
    `/platform-admin/menus/${payload.menuId}`,
    payload,
  );
  return data;
}

export async function deletePlatformMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/platform-admin/menus/${menuId}`);
}
