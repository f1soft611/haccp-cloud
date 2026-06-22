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

type MenuUpsertApiPayload = {
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
    menuList?: RawPlatformMenuItem[];
    totalCount?: number;
    paginationInfo?: {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    };
  };
};

type RawPlatformMenuItem = Omit<PlatformMenuItem, 'menuId' | 'parentMenuId'> & {
  menuId?: string | number | null;
  menuCode?: string | null;
  parentMenuId?: string | number | null;
  parentMenuCode?: string | null;
};

type MenuListApiResponse =
  | RawPlatformMenuItem[]
  | {
      result?: {
        menuList?: RawPlatformMenuItem[];
      };
      menuList?: RawPlatformMenuItem[];
    };

type MenuItemApiResponse =
  | PlatformMenuItem
  | {
      result?: {
        menuInfo?: PlatformMenuItem;
      };
      menuInfo?: PlatformMenuItem;
    };

function normalizeTextValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function normalizeParentMenuId(value: unknown): string | null {
  const normalized = normalizeTextValue(value);
  return normalized === '' ? null : normalized;
}

function normalizeMenuId(item: RawPlatformMenuItem): string {
  return normalizeTextValue(item.menuId);
}

function normalizeParentMenuCode(item: RawPlatformMenuItem): string | null {
  return normalizeParentMenuId(item.parentMenuId);
}

function normalizeMenuItem(item: RawPlatformMenuItem): PlatformMenuItem {
  return {
    ...item,
    menuId: normalizeMenuId(item),
    parentMenuId: normalizeParentMenuCode(item),
  };
}

function extractMenuList(data: MenuListApiResponse): RawPlatformMenuItem[] {
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
  const requestBody: MenuUpsertApiPayload = {
    menuNm: payload.menuNm,
    menuDc: payload.menuDc,
    menuUrl: payload.menuUrl,
    parentMenuId: normalizeParentMenuId(payload.parentMenuId),
    menuOrdr: payload.menuOrdr,
    iconNm: payload.iconNm,
    useAt: payload.useAt,
  };

  await apiClient.post<MenuItemApiResponse>(
    '/platform-admin/menus',
    requestBody,
  );
}

export async function updatePlatformMenu(
  payload: UpdatePlatformMenuRequest,
): Promise<void> {
  const { menuId, ...rest } = payload;
  const requestBody: MenuUpsertApiPayload = {
    menuNm: rest.menuNm,
    menuDc: rest.menuDc,
    menuUrl: rest.menuUrl,
    parentMenuId: normalizeParentMenuId(rest.parentMenuId),
    menuOrdr: rest.menuOrdr,
    iconNm: rest.iconNm,
    useAt: rest.useAt,
  };

  await apiClient.patch<MenuItemApiResponse>(
    `/platform-admin/menus/${menuId}`,
    requestBody,
  );
}

export async function deletePlatformMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/platform-admin/menus/${menuId}`);
}
