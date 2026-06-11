import { apiClient } from './apiClient';

export type DepartmentItem = {
  id: string;
  tenantCode: string;
  name: string;
  active: boolean;
};

export async function listDepartments(
  tenantCode: string,
): Promise<DepartmentItem[]> {
  const { data } = await apiClient.get<DepartmentItem[]>('/departments', {
    headers: { 'x-tenant-code': tenantCode },
  });
  return data;
}

export async function createDepartment(payload: {
  tenantCode: string;
  name: string;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.post<DepartmentItem>(
    '/departments',
    payload,
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );
  return data;
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
