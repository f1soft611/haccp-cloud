import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

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

type RawDepartmentItem = Omit<
  DepartmentItem,
  'id' | 'parentId' | 'sortOrder'
> & {
  id?: string | number | null;
  departmentId?: string | number | null;
  parentId?: string | number | null;
  parentDepartmentId?: string | number | null;
  sortOrder?: number | string | null;
};

type DepartmentListResult = {
  resultList?: RawDepartmentItem[];
};

type DepartmentItemResult = {
  item?: RawDepartmentItem;
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

function normalizeNullableId(value: unknown): string | null {
  const normalized = normalizeTextValue(value);
  return normalized === '' ? null : normalized;
}

function normalizeNumberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(normalizeTextValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDepartmentItem(
  raw: Partial<RawDepartmentItem>,
): DepartmentItem {
  const id = normalizeTextValue(raw.id ?? raw.departmentId);
  return {
    id,
    tenantCode: normalizeTextValue(raw.tenantCode),
    name: normalizeTextValue(raw.name),
    parentId: normalizeNullableId(raw.parentId ?? raw.parentDepartmentId),
    parentName:
      raw.parentName == null ? null : normalizeTextValue(raw.parentName),
    sortOrder: normalizeNumberValue(raw.sortOrder),
    active: Boolean(raw.active),
    hasChildren: Boolean(raw.hasChildren),
  };
}

export async function listDepartments(
  params: DepartmentSearchParams,
): Promise<DepartmentItem[]> {
  const { data } = await apiClient.get<ResultEnvelope<DepartmentListResult>>(
    '/v1/departments',
    {
      headers: { 'x-tenant-code': params.tenantCode },
      params: {
        name: params.name || undefined,
        active: params.active || undefined,
      },
    },
  );
  return (data?.result?.resultList ?? []).map(normalizeDepartmentItem);
}

export async function createDepartment(payload: {
  tenantCode: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.post<ResultEnvelope<DepartmentItemResult>>(
    '/v1/departments',
    {
      name: payload.name,
      parentId: normalizeNullableId(payload.parentId),
      sortOrder: payload.sortOrder,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return normalizeDepartmentItem(data?.result?.item ?? {});
}

export async function updateDepartment(payload: {
  tenantCode: string;
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.put<ResultEnvelope<DepartmentItemResult>>(
    `/v1/departments/${payload.id}`,
    {
      name: payload.name,
      parentId: normalizeNullableId(payload.parentId),
      sortOrder: payload.sortOrder,
      active: payload.active,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return normalizeDepartmentItem(data?.result?.item ?? {});
}

export async function deleteDepartment(payload: {
  tenantCode: string;
  id: string;
}): Promise<void> {
  await apiClient.delete(`/v1/departments/${payload.id}`, {
    headers: { 'x-tenant-code': payload.tenantCode },
  });
}

export async function updateDepartmentStatus(payload: {
  tenantCode: string;
  id: string;
  active: boolean;
}): Promise<DepartmentItem> {
  const { data } = await apiClient.patch<RawDepartmentItem>(
    `/v1/departments/${payload.id}`,
    { active: payload.active },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );
  return normalizeDepartmentItem(data);
}
