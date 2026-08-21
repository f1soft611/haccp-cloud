import { apiClient } from '../api/apiClient';
import { normalizePlatformTenantCode } from '../../shared/tenant/platformTenant';

type ResultEnvelope<T> = {
  result?: T;
};

type PlatformRoleApiItem = {
  id?: string | number;
  authorityId?: string | number;
  roleId?: string | number;
  code?: string;
  roleCode?: string;
  name?: string;
  roleNm?: string;
  description?: string;
  roleDc?: string;
  authorityDc?: string;
  active?: boolean;
  updatedBy?: string;
  updatedAt?: string;
  authorityCode?: string;
  authorityNm?: string;
  useAt?: 'Y' | 'N';
  lastUpdusrId?: string;
  lastUpdtPnttm?: string;
  tenantCode?: string;
  systemRole?: boolean;
  isSystemRole?: boolean;
  systemRoleYn?: string;
  is_system_role?: string;
};

export type PlatformRoleItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  tenantCode?: string;
  systemRole: boolean;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
};

export type CreatePlatformRoleRequest = {
  tenantCode?: string;
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
  tenantCode?: string;
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

type RoleListResult = {
  resultList?: PlatformRoleApiItem[];
};

type RoleItemResult = {
  item?: PlatformRoleApiItem;
};

function normalizePlatformRoleItem(
  item: PlatformRoleApiItem,
): PlatformRoleItem {
  const code = item.code ?? item.roleCode ?? item.authorityCode ?? '';
  const normalizedId = item.id ?? item.roleId ?? item.authorityId;
  const normalizedSystemRoleYn = String(
    item.systemRoleYn ?? item.is_system_role ?? '',
  )
    .trim()
    .toUpperCase();
  const systemRole =
    item.systemRole === true ||
    item.isSystemRole === true ||
    normalizedSystemRoleYn === 'Y';

  return {
    id: normalizedId == null ? code : String(normalizedId),
    code,
    name: item.name ?? item.roleNm ?? item.authorityNm ?? code,
    description: item.description ?? item.roleDc ?? item.authorityDc ?? '',
    tenantCode: item.tenantCode,
    systemRole,
    active: item.active ?? item.useAt !== 'N',
    updatedBy: item.updatedBy ?? item.lastUpdusrId ?? '',
    updatedAt: item.updatedAt ?? item.lastUpdtPnttm ?? '',
  };
}

export async function listPlatformRoles(): Promise<PlatformRoleItem[]> {
  const { data } = await apiClient.get<ResultEnvelope<RoleListResult>>(
    '/v1/platform-admin/roles',
  );
  return (data?.result?.resultList ?? []).map(normalizePlatformRoleItem);
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
    '/v1/platform-admin/roles/paged',
    {
      params: {
        ...params,
        tenantCode: params.tenantCode
          ? normalizePlatformTenantCode(params.tenantCode)
          : undefined,
      },
    },
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
  const { data } = await apiClient.post<ResultEnvelope<RoleItemResult>>(
    '/v1/platform-admin/roles',
    {
      roleCode: payload.code,
      roleNm: payload.name,
      roleDc: payload.description,
      authorityDc: payload.description,
      active: payload.active,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      authorityCode: payload.code,
      authorityNm: payload.name,
      useAt: payload.active ? 'Y' : 'N',
      tenantCode: payload.tenantCode
        ? normalizePlatformTenantCode(payload.tenantCode)
        : undefined,
    },
  );
  return normalizePlatformRoleItem(data?.result?.item ?? {});
}

export async function updatePlatformRoleStatus(
  payload: UpdatePlatformRoleStatusRequest,
): Promise<PlatformRoleItem> {
  const roleIdentifier = payload.id ?? payload.code;
  if (!roleIdentifier) {
    throw new Error('role code or id is required');
  }

  const { data } = await apiClient.patch<ResultEnvelope<RoleItemResult>>(
    `/v1/platform-admin/roles/${roleIdentifier}`,
    {
      active: payload.active,
      useAt: payload.active ? 'Y' : 'N',
    },
  );
  return normalizePlatformRoleItem(data?.result?.item ?? {});
}

export async function updatePlatformRole(
  payload: UpdatePlatformRoleRequest,
): Promise<PlatformRoleItem> {
  const roleIdentifier = payload.id ?? payload.code;
  if (!roleIdentifier) {
    throw new Error('role code or id is required');
  }

  const { data } = await apiClient.put<ResultEnvelope<RoleItemResult>>(
    `/v1/platform-admin/roles/${roleIdentifier}`,
    {
      roleCode: payload.code,
      roleNm: payload.name,
      roleDc: payload.description,
      authorityDc: payload.description,
      active: payload.active,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      authorityCode: payload.code,
      authorityNm: payload.name,
      useAt: payload.active ? 'Y' : 'N',
    },
  );
  return normalizePlatformRoleItem(data?.result?.item ?? {});
}
