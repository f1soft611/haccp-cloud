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

export type ListPlatformMenusPagedParams = {
  pageIndex: number;
  pageSize: number;
  searchField?: 'menuNm' | 'menuDc' | 'menuUrl';
  searchKeyword?: string;
  useAt?: 'Y' | 'N' | 'all';
};

type MenuPagedApiResponse = {
  result?: {
    menuList?: PlatformMenuItem[];
    totalCount?: number;
    paginationInfo?: {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    };
  };
};

type MenuListApiResponse =
  | PlatformMenuItem[]
  | {
      result?: {
        menuList?: PlatformMenuItem[];
      };
      menuList?: PlatformMenuItem[];
    };

type MenuItemApiResponse =
  | PlatformMenuItem
  | {
      result?: {
        menuInfo?: PlatformMenuItem;
      };
      menuInfo?: PlatformMenuItem;
    };

function normalizeParentMenuId(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  return value.trim() === '' ? null : value;
}

function normalizeMenuItem(item: PlatformMenuItem): PlatformMenuItem {
  return {
    ...item,
    parentMenuId: normalizeParentMenuId(item.parentMenuId),
  };
}

function extractMenuList(data: MenuListApiResponse): PlatformMenuItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  const items = data.result?.menuList ?? data.menuList ?? [];
  return items;
}

export async function listPlatformMenus(): Promise<PlatformMenuItem[]> {
  const { data } = await apiClient.get<MenuListApiResponse>(
    '/platform-admin/menus',
  );
  return extractMenuList(data).map(normalizeMenuItem);
}

export async function listPlatformMenusPaged(
  params: ListPlatformMenusPagedParams,
): Promise<{
  items: PlatformMenuItem[];
  totalCount: number;
  paginationInfo?: {
    currentPageNo?: number;
    recordCountPerPage?: number;
    totalRecordCount?: number;
  };
}> {
  const { data } = await apiClient.get<MenuPagedApiResponse>(
    '/platform-admin/menus/paged',
    { params },
  );

  return {
    items: (data.result?.menuList ?? []).map(normalizeMenuItem),
    totalCount: data.result?.totalCount ?? 0,
    paginationInfo: data.result?.paginationInfo,
  };
}

export async function createPlatformMenu(
  payload: CreatePlatformMenuRequest,
): Promise<void> {
  await apiClient.post<MenuItemApiResponse>('/platform-admin/menus', payload);
}

export async function updatePlatformMenu(
  payload: UpdatePlatformMenuRequest,
): Promise<void> {
  await apiClient.patch<MenuItemApiResponse>(
    `/platform-admin/menus/${payload.menuId}`,
    payload,
  );
}

export async function deletePlatformMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/platform-admin/menus/${menuId}`);
}
