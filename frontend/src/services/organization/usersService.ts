import { apiClient } from '../api/apiClient';
import type { UserRole } from '../../shared/store/authStore';

type ResultEnvelope<T> = {
  resultCode?: number | string;
  resultMessage?: string;
  result?: T;
};

export type UserItem = {
  id: string;
  tenantCode: string;
  name: string;
  email: string;
  department: string;
  roleCode: string;
  roleCodes: string[];
  role?: UserRole;
  active: boolean;
  profileImage?: string;
  signatureImage?: string;
  stampImage?: string;
};

export type MyPageProfile = UserItem;

export type ListUsersPagedParams = {
  tenantCode?: string;
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  filterActive?: 'all' | 'Y' | 'N';
};

export type ListUsersPagedResult = {
  items: UserItem[];
  totalCount: number;
};

export type CreateUserRequest = {
  tenantCode?: string;
  name: string;
  email: string;
  department: string;
  roleCode?: string;
  active?: boolean;
};

export type UpdateUserRequest = {
  tenantCode?: string;
  id: string;
  name: string;
  email: string;
  department: string;
  roleCode?: string;
  active?: boolean;
};

type UsersListResult = {
  resultList?: Array<Parameters<typeof normalizeUserItem>[0]>;
};

type UsersPagedResult = {
  items?: Array<Parameters<typeof normalizeUserItem>[0]>;
  totalCount?: number;
};

type ItemResult = {
  item?: Parameters<typeof normalizeUserItem>[0];
};

type MessageResult = {
  message?: string;
};

type ImageUpdateRequest = {
  profileImage?: string;
  stampImage?: string;
};

function unwrapResult<T>(payload: T | ResultEnvelope<T>): T {
  const envelope = payload as ResultEnvelope<T>;
  const resultCode = String(envelope?.resultCode ?? '').trim();
  const numericResultCode = Number(resultCode);
  if (
    resultCode &&
    Number.isFinite(numericResultCode) &&
    numericResultCode !== 200
  ) {
    throw {
      response: {
        data: {
          message:
            (envelope?.resultMessage ?? '').trim() ||
            '요청 처리 중 오류가 발생했습니다.',
        },
      },
      message:
        (envelope?.resultMessage ?? '').trim() ||
        '요청 처리 중 오류가 발생했습니다.',
    };
  }

  return (envelope?.result ?? payload) as T;
}

function normalizeRoleCode(input: {
  roleCode?: string;
  roleCodes?: string[];
  roleCodesText?: string;
  role?: string;
}): string {
  const fromRoleCode = String(input.roleCode ?? '')
    .trim()
    .toUpperCase();
  if (fromRoleCode.length > 0) {
    return fromRoleCode;
  }

  const fromRoleCodes = (input.roleCodes ?? [])
    .map((item) =>
      String(item ?? '')
        .trim()
        .toUpperCase(),
    )
    .find((item) => item.length > 0);
  if (fromRoleCodes) {
    return fromRoleCodes;
  }

  const fromRoleCodesText = String(input.roleCodesText ?? '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .find((item) => item.length > 0);
  if (fromRoleCodesText) {
    return fromRoleCodesText;
  }

  return String(input.role ?? '')
    .trim()
    .toUpperCase();
}

function normalizeUserItem(raw: {
  id?: string | number;
  userId?: string | number;
  tenantCode?: string;
  name?: string;
  userNm?: string;
  email?: string;
  emailAddr?: string;
  department?: string;
  departmentNm?: string;
  roleCode?: string;
  roleCodes?: string[];
  roleCodesText?: string;
  role?: string;
  active?: boolean;
  profileImage?: string;
  signatureImage?: string;
  stampImage?: string;
}): UserItem {
  const roleCode = normalizeRoleCode(raw) || 'USER';
  const roleCodes = roleCode ? [roleCode] : [];

  return {
    id: String(raw.id ?? raw.userId ?? ''),
    tenantCode: String(raw.tenantCode ?? '').trim(),
    name: String(raw.name ?? raw.userNm ?? '').trim(),
    email: String(raw.email ?? raw.emailAddr ?? '').trim(),
    department: String(raw.department ?? raw.departmentNm ?? '').trim(),
    roleCode,
    roleCodes,
    role:
      roleCode === 'PLATFORM_ADMIN' ||
      roleCode === 'TENANT_ADMIN' ||
      roleCode === 'TENANT_USER'
        ? (roleCode as UserRole)
        : 'USER',
    active: raw.active !== false,
    profileImage: String(raw.profileImage ?? '').trim() || undefined,
    signatureImage: String(raw.signatureImage ?? '').trim() || undefined,
    stampImage: String(raw.stampImage ?? '').trim() || undefined,
  };
}

export async function listUsers(tenantCode?: string): Promise<UserItem[]> {
  const headers = tenantCode ? { 'x-tenant-code': tenantCode } : undefined;

  const { data } = await apiClient.get<ResultEnvelope<UsersListResult>>(
    '/v1/users',
    {
      headers,
    },
  );
  return (data?.result?.resultList ?? []).map(normalizeUserItem);
}

export async function listUsersPaged(
  params: ListUsersPagedParams,
): Promise<ListUsersPagedResult> {
  const headers = params.tenantCode
    ? { 'x-tenant-code': params.tenantCode }
    : undefined;

  const { data } = await apiClient.get<ResultEnvelope<UsersPagedResult>>(
    '/v1/users/paged',
    {
      headers,
      params: {
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        keyword: params.keyword || undefined,
        filterActive:
          params.filterActive && params.filterActive !== 'all'
            ? params.filterActive
            : undefined,
      },
    },
  );

  return {
    items: (data?.result?.items ?? []).map(normalizeUserItem),
    totalCount: data?.result?.totalCount ?? 0,
  };
}

export async function createUser(
  payload: CreateUserRequest,
): Promise<UserItem> {
  const roleCode = normalizeRoleCode({ roleCode: payload.roleCode });

  const { data } = await apiClient.post<ResultEnvelope<ItemResult>>(
    '/v1/users',
    {
      name: payload.name,
      email: payload.email,
      department: payload.department,
      roleCode: roleCode || 'TENANT_USER',
      active: payload.active ?? true,
    },
  );
  return normalizeUserItem(data?.result?.item ?? {});
}

export async function updateUser(
  payload: UpdateUserRequest,
): Promise<UserItem> {
  const roleCode = normalizeRoleCode({ roleCode: payload.roleCode });

  const { data } = await apiClient.put<ResultEnvelope<ItemResult>>(
    `/v1/users/${payload.id}`,
    {
      name: payload.name,
      email: payload.email,
      department: payload.department,
      roleCode: roleCode || 'TENANT_USER',
      active: payload.active,
    },
  );
  return normalizeUserItem(data?.result?.item ?? {});
}

export async function updateUserStatus(payload: {
  tenantCode?: string;
  id: string;
  active: boolean;
}): Promise<UserItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.patch<ResultEnvelope<ItemResult>>(
    `/v1/users/${payload.id}`,
    { active: payload.active },
    { headers },
  );
  return normalizeUserItem(data?.result?.item ?? {});
}

export async function getMyPageProfile(): Promise<MyPageProfile> {
  const { data } =
    await apiClient.get<ResultEnvelope<ItemResult>>('/v1/users/me');

  return normalizeUserItem(data?.result?.item ?? {});
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const { data } = await apiClient.patch<ResultEnvelope<MessageResult>>(
    '/v1/users/me/password',
    payload,
  );

  const result = unwrapResult<MessageResult>(data ?? {});
  return String(result?.message ?? '').trim() || '비밀번호가 변경되었습니다.';
}

export async function changeMyPageImages(
  payload: ImageUpdateRequest,
): Promise<UserItem> {
  const { data } = await apiClient.patch<ResultEnvelope<ItemResult>>(
    '/v1/users/me/images',
    payload,
  );

  return normalizeUserItem(data?.result?.item ?? {});
}
