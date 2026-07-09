import { apiClient } from '../api/apiClient';

export type HaccpBaseCategoryItem = {
  id: string;
  tenantCode: string;
  categoryCode: string;
  categoryName: string;
  sortOrder: number;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
};

type RawHaccpBaseCategoryItem = {
  draftingWorkCategoryGroupId?: number | string | null;
  id?: number | string | null;
  tenantCode?: string | null;
  categoryCode?: string | null;
  cataCode?: string | null;
  categoryName?: string | null;
  cataName?: string | null;
  sortOrder?: number | string | null;
  viewSeq?: number | string | null;
  active?: boolean | string | null;
  useAt?: string | null;
  createdBy?: number | string | null;
  createdAt?: string | null;
};

type ResultEnvelope<T> = {
  result?: {
    resultList?: T[];
    item?: T;
  };
};

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(normalizeText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = normalizeText(value).toUpperCase();
  return normalized === 'Y' || normalized === 'TRUE' || normalized === '1';
}

function normalizeItem(raw: RawHaccpBaseCategoryItem): HaccpBaseCategoryItem {
  const id = normalizeText(raw.id ?? raw.draftingWorkCategoryGroupId);
  return {
    id,
    tenantCode: normalizeText(raw.tenantCode),
    categoryCode: normalizeText(raw.categoryCode ?? raw.cataCode),
    categoryName: normalizeText(raw.categoryName ?? raw.cataName),
    sortOrder: normalizeNumber(raw.sortOrder ?? raw.viewSeq),
    active: normalizeBoolean(raw.active ?? raw.useAt),
    createdBy: normalizeText(raw.createdBy),
    createdAt: normalizeText(raw.createdAt),
  };
}

export async function listHaccpBaseCategories(params: {
  tenantCode: string;
  active?: 'Y' | 'N';
}): Promise<HaccpBaseCategoryItem[]> {
  const { data } = await apiClient.get<
    RawHaccpBaseCategoryItem[] | ResultEnvelope<RawHaccpBaseCategoryItem>
  >('/v1/haccp-base/categories', {
    headers: { 'x-tenant-code': params.tenantCode },
    params: { active: params.active || undefined },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);

  return items.map(normalizeItem);
}

export async function createHaccpBaseCategory(payload: {
  tenantCode: string;
  categoryCode: string;
  categoryName: string;
  sortOrder: number;
  active: boolean;
}): Promise<HaccpBaseCategoryItem> {
  const { data } = await apiClient.post<
    RawHaccpBaseCategoryItem | ResultEnvelope<RawHaccpBaseCategoryItem>
  >(
    '/v1/haccp-base/categories',
    {
      categoryCode: payload.categoryCode,
      categoryName: payload.categoryName,
      sortOrder: payload.sortOrder,
      active: payload.active,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );

  const item = Array.isArray(data)
    ? data[0]
    : ((data as ResultEnvelope<RawHaccpBaseCategoryItem>)?.result?.item ??
      (data as RawHaccpBaseCategoryItem));

  return normalizeItem(item ?? {});
}

export async function updateHaccpBaseCategory(payload: {
  tenantCode: string;
  id: string;
  categoryName: string;
  sortOrder: number;
  active: boolean;
}): Promise<HaccpBaseCategoryItem> {
  const { data } = await apiClient.put<
    RawHaccpBaseCategoryItem | ResultEnvelope<RawHaccpBaseCategoryItem>
  >(
    `/v1/haccp-base/categories/${payload.id}`,
    {
      categoryName: payload.categoryName,
      sortOrder: payload.sortOrder,
      active: payload.active,
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );

  const item = Array.isArray(data)
    ? data[0]
    : ((data as ResultEnvelope<RawHaccpBaseCategoryItem>)?.result?.item ??
      (data as RawHaccpBaseCategoryItem));

  return normalizeItem(item ?? {});
}
