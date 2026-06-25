import { apiClient } from '../api/apiClient';
import type { UserRole } from '../../shared/store/authStore';

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
};

export type CreateUserRequest = {
  tenantCode?: string;
  name: string;
  email: string;
  department: string;
  roleCode?: UserRole;
  roleCodes?: string[];
  active?: boolean;
};

export type UpdateUserRequest = {
  tenantCode?: string;
  id: string;
  name: string;
  email: string;
  department: string;
  roleCode?: UserRole;
  roleCodes?: string[];
  active?: boolean;
};

function normalizeRoleCodes(input: {
  roleCode?: string;
  roleCodes?: string[];
  role?: string;
}): string[] {
  const merged = [
    ...(input.roleCodes ?? []),
    input.roleCode ?? '',
    input.role ?? '',
  ];

  return Array.from(
    new Set(
      merged
        .map((item) =>
          String(item ?? '')
            .trim()
            .toUpperCase(),
        )
        .filter((item) => item.length > 0),
    ),
  );
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
  role?: string;
  active?: boolean;
}): UserItem {
  const roleCodes = normalizeRoleCodes(raw);
  const roleCode = roleCodes[0] ?? 'USER';

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
  };
}

export async function listUsers(tenantCode?: string): Promise<UserItem[]> {
  const headers = tenantCode ? { 'x-tenant-code': tenantCode } : undefined;

  const { data } = await apiClient.get<
    Array<{
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
      role?: string;
      active?: boolean;
    }>
  >('/users', {
    headers,
  });
  return (data ?? []).map(normalizeUserItem);
}

export async function createUser(
  payload: CreateUserRequest,
): Promise<UserItem> {
  const roleCodes =
    normalizeRoleCodes({
      roleCode: payload.roleCode,
      roleCodes: payload.roleCodes,
    }) || [];

  const { data } = await apiClient.post('/users', {
    name: payload.name,
    email: payload.email,
    department: payload.department,
    roleCode: roleCodes[0] ?? 'TENANT_USER',
    roleCodes,
    active: payload.active ?? true,
  });
  return normalizeUserItem(data as Parameters<typeof normalizeUserItem>[0]);
}

export async function updateUser(
  payload: UpdateUserRequest,
): Promise<UserItem> {
  const roleCodes = normalizeRoleCodes({
    roleCode: payload.roleCode,
    roleCodes: payload.roleCodes,
  });

  const { data } = await apiClient.put(`/users/${payload.id}`, {
    name: payload.name,
    email: payload.email,
    department: payload.department,
    roleCode: roleCodes[0] ?? 'TENANT_USER',
    roleCodes,
    active: payload.active,
  });
  return normalizeUserItem(data as Parameters<typeof normalizeUserItem>[0]);
}

export async function updateUserStatus(payload: {
  tenantCode?: string;
  id: string;
  active: boolean;
}): Promise<UserItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.patch(
    `/users/${payload.id}`,
    { active: payload.active },
    { headers },
  );
  return normalizeUserItem(data as Parameters<typeof normalizeUserItem>[0]);
}
