import { apiClient } from '../api/apiClient';

type PlatformRoleApiItem = {
  id?: string | number;
  authorityId?: string | number;
  code?: string;
  name?: string;
  description?: string;
  authorityDc?: string;
  active?: boolean;
  updatedBy?: string;
  updatedAt?: string;
  authorityCode?: string;
  authorityNm?: string;
  useAt?: 'Y' | 'N';
  lastUpdusrId?: string;
  lastUpdtPnttm?: string;
};

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
  id?: string;
  code?: string;
  name: string;
  description?: string;
  active: boolean;
};

export type UpdatePlatformRoleStatusRequest = {
  id?: string;
  code?: string;
  active: boolean;
};

export type ListPlatformRolesPagedParams = {
  pageIndex: number;
  pageSize: number;
  searchField?: 'code' | 'name' | 'description';
  searchKeyword?: string;
  useAt?: 'Y' | 'N' | 'all';
};

type PlatformRolesPagedResponse = {
  result?: {
    roleList?: PlatformRoleApiItem[];
    totalCount?: number;
    paginationInfo?: {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    };
  };
};

function normalizePlatformRoleItem(
  item: PlatformRoleApiItem,
): PlatformRoleItem {
  const code = item.code ?? item.authorityCode ?? '';
  const normalizedId = item.id ?? item.authorityId;
  return {
    id: normalizedId == null ? code : String(normalizedId),
    code,
    name: item.name ?? item.authorityNm ?? code,
    description: item.description ?? item.authorityDc ?? '',
    active: item.active ?? item.useAt !== 'N',
    updatedBy: item.updatedBy ?? item.lastUpdusrId ?? '',
    updatedAt: item.updatedAt ?? item.lastUpdtPnttm ?? '',
  };
}

export async function listPlatformRoles(): Promise<PlatformRoleItem[]> {
  const { data } = await apiClient.get<PlatformRoleApiItem[]>(
    '/platform-admin/roles',
  );
  return data.map(normalizePlatformRoleItem);
}

export async function listPlatformRolesPaged(
  params: ListPlatformRolesPagedParams,
): Promise<{
  items: PlatformRoleItem[];
  totalCount: number;
  paginationInfo?: {
    currentPageNo?: number;
    recordCountPerPage?: number;
    totalRecordCount?: number;
  };
}> {
  const { data } = await apiClient.get<PlatformRolesPagedResponse>(
    '/platform-admin/roles/paged',
    { params },
  );

  return {
    items: (data.result?.roleList ?? []).map(normalizePlatformRoleItem),
    totalCount: data.result?.totalCount ?? 0,
    paginationInfo: data.result?.paginationInfo,
  };
}

export async function createPlatformRole(
  payload: CreatePlatformRoleRequest,
): Promise<PlatformRoleItem> {
  const { data } = await apiClient.post<PlatformRoleApiItem>(
    '/platform-admin/roles',
    {
      code: payload.code,
      name: payload.name,
      description: payload.description,
      authorityDc: payload.description,
      active: payload.active,
      authorityCode: payload.code,
      authorityNm: payload.name,
      useAt: payload.active ? 'Y' : 'N',
    },
  );
  return normalizePlatformRoleItem(data);
}

export async function updatePlatformRoleStatus(
  payload: UpdatePlatformRoleStatusRequest,
): Promise<PlatformRoleItem> {
  const roleIdentifier = payload.id ?? payload.code;
  if (!roleIdentifier) {
    throw new Error('role code or id is required');
  }

  const { data } = await apiClient.patch<PlatformRoleApiItem>(
    `/platform-admin/roles/${roleIdentifier}`,
    {
      active: payload.active,
      useAt: payload.active ? 'Y' : 'N',
    },
  );
  return normalizePlatformRoleItem(data);
}

export async function updatePlatformRole(
  payload: UpdatePlatformRoleRequest,
): Promise<PlatformRoleItem> {
  const roleIdentifier = payload.id ?? payload.code;
  if (!roleIdentifier) {
    throw new Error('role code or id is required');
  }

  const { data } = await apiClient.put<PlatformRoleApiItem>(
    `/platform-admin/roles/${roleIdentifier}`,
    {
      code: payload.code,
      name: payload.name,
      description: payload.description,
      authorityDc: payload.description,
      active: payload.active,
      authorityCode: payload.code,
      authorityNm: payload.name,
      useAt: payload.active ? 'Y' : 'N',
    },
  );
  return normalizePlatformRoleItem(data);
}
