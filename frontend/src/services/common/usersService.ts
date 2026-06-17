import { apiClient } from '../api/apiClient';
import type { UserRole } from '../../shared/store/authStore';

export type UserItem = {
  id: string;
  tenantCode: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  active: boolean;
};

export type CreateUserRequest = {
  tenantCode: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
};

export async function listUsers(tenantCode: string): Promise<UserItem[]> {
  const { data } = await apiClient.get<UserItem[]>('/users', {
    headers: { 'x-tenant-code': tenantCode },
  });
  return data;
}

export async function createUser(
  payload: CreateUserRequest,
): Promise<UserItem> {
  const { data } = await apiClient.post<UserItem>('/users', payload, {
    headers: { 'x-tenant-code': payload.tenantCode },
  });
  return data;
}

export async function updateUserStatus(payload: {
  tenantCode: string;
  id: string;
  active: boolean;
}): Promise<UserItem> {
  const { data } = await apiClient.patch<UserItem>(
    `/users/${payload.id}`,
    { active: payload.active },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return data;
}
