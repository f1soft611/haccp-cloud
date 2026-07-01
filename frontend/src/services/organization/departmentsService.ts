import { apiClient } from '../api/apiClient';

export type DepartmentItem = {
  id: string;
  tenantCode: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  active: boolean;
  hasChildren: boolean;
};

export type DepartmentSearchParams = {
  tenantCode: string;
  name?: string;
  active?: 'Y' | 'N' | '';
};

export type DepartmentFormData = {
  name: string;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
};

export async function listDepartments(
  params: DepartmentSearchParams,
): Promise<DepartmentItem[]> {
  const { data } = await apiClient.get<DepartmentItem[]>('/departments', {
    headers: { 'x-tenant-code': params.tenantCode },
    params: {
      name: params.name || undefined,
      active: params.active || undefined,
    },
  });
  return data;
}

export async function createDepartment(payload: {
  tenantCode: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.post<DepartmentItem>(
    '/departments',
    {
      name: payload.name,
      parentId: payload.parentId,
      sortOrder: payload.sortOrder,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return data;
}

export async function updateDepartment(payload: {
  tenantCode: string;
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.put<DepartmentItem>(
    `/departments/${payload.id}`,
    {
      name: payload.name,
      parentId: payload.parentId,
      sortOrder: payload.sortOrder,
      active: payload.active,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return data;
}

export async function deleteDepartment(payload: {
  tenantCode: string;
  id: string;
}): Promise<void> {
  await apiClient.delete(`/departments/${payload.id}`, {
    headers: { 'x-tenant-code': payload.tenantCode },
  });
}

export async function updateDepartmentStatus(payload: {
  tenantCode: string;
  id: string;
  active: boolean;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.patch<DepartmentItem>(
    `/departments/${payload.id}`,
    { active: payload.active },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return data;
}
