import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

export type MaterialItem = {
  id: string;
  materialCode: string;
  materialName: string;
  itemType: string;
  materialSpec: string;
  materialWeight: number | null;
  unit: string;
  materialKind: string;
  storeMethod: string;
  expiryedStatus: string;
  expiryedCount: number | null;
  kfdaReportNo: string;
  etc: string;
};

export type ListMaterialsPagedParams = {
  tenantCode?: string;
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  itemTypes?: string[];
};

export type ListMaterialsPagedResult = {
  items: MaterialItem[];
  totalCount: number;
};

export type CreateMaterialRequest = {
  tenantCode?: string;
  materialName: string;
  itemType?: string;
  materialSpec?: string;
  materialWeight: number | null;
  unit?: string;
  materialKind?: string;
  storeMethod?: string;
  expiryedStatus: string;
  expiryedCount: number | null;
  kfdaReportNo?: string;
  etc?: string;
};

export type UpdateMaterialRequest = CreateMaterialRequest & {
  id: string;
};

type RawMaterialItem = Partial<{
  materialId: string | number;
  materialCode: string;
  materialName: string;
  itemType: string;
  materialSpec: string;
  materialWeight: number | string | null;
  unit: string;
  materialKind: string;
  storeMethod: string;
  expiryedStatus: string;
  expiryedCount: number | string | null;
  kfdaReportNo: string;
  etc: string;
}>;

type MaterialsPagedResult = {
  items?: RawMaterialItem[];
  totalCount?: number;
};

type MaterialItemResult = {
  item?: RawMaterialItem;
};

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMaterialItem(raw: RawMaterialItem): MaterialItem {
  return {
    id: String(raw.materialId ?? ''),
    materialCode: String(raw.materialCode ?? ''),
    materialName: String(raw.materialName ?? ''),
    itemType: String(raw.itemType ?? ''),
    materialSpec: String(raw.materialSpec ?? ''),
    materialWeight: toNullableNumber(raw.materialWeight),
    unit: String(raw.unit ?? ''),
    materialKind: String(raw.materialKind ?? ''),
    storeMethod: String(raw.storeMethod ?? ''),
    expiryedStatus: String(raw.expiryedStatus || 'NONE'),
    expiryedCount: toNullableNumber(raw.expiryedCount),
    kfdaReportNo: String(raw.kfdaReportNo ?? ''),
    etc: String(raw.etc ?? ''),
  };
}

export async function listMaterialsPaged(
  params: ListMaterialsPagedParams,
): Promise<ListMaterialsPagedResult> {
  const headers = params.tenantCode
    ? { 'x-tenant-code': params.tenantCode }
    : undefined;

  const { data } = await apiClient.get<ResultEnvelope<MaterialsPagedResult>>(
    '/v1/basicinfo/materials/paged',
    {
      headers,
      params: {
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        keyword: params.keyword || undefined,
        itemTypes: params.itemTypes?.length ? params.itemTypes.join(',') : undefined,
      },
    },
  );

  return {
    items: (data?.result?.items ?? []).map(normalizeMaterialItem),
    totalCount: data?.result?.totalCount ?? 0,
  };
}

export async function createMaterial(
  payload: CreateMaterialRequest,
): Promise<MaterialItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.post<ResultEnvelope<MaterialItemResult>>(
    '/v1/basicinfo/materials',
    {
      materialName: payload.materialName,
      itemType: payload.itemType,
      materialSpec: payload.materialSpec,
      materialWeight: payload.materialWeight,
      unit: payload.unit,
      materialKind: payload.materialKind,
      storeMethod: payload.storeMethod,
      expiryedStatus: payload.expiryedStatus,
      expiryedCount: payload.expiryedCount,
      kfdaReportNo: payload.kfdaReportNo,
      etc: payload.etc,
    },
    { headers },
  );
  return normalizeMaterialItem(data?.result?.item ?? {});
}

export async function updateMaterial(
  payload: UpdateMaterialRequest,
): Promise<MaterialItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.put<ResultEnvelope<MaterialItemResult>>(
    `/v1/basicinfo/materials/${payload.id}`,
    {
      materialName: payload.materialName,
      itemType: payload.itemType,
      materialSpec: payload.materialSpec,
      materialWeight: payload.materialWeight,
      unit: payload.unit,
      materialKind: payload.materialKind,
      storeMethod: payload.storeMethod,
      expiryedStatus: payload.expiryedStatus,
      expiryedCount: payload.expiryedCount,
      kfdaReportNo: payload.kfdaReportNo,
      etc: payload.etc,
    },
    { headers },
  );
  return normalizeMaterialItem(data?.result?.item ?? {});
}

export async function deleteMaterial(payload: {
  tenantCode?: string;
  id: string;
}): Promise<void> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  await apiClient.delete(`/v1/basicinfo/materials/${payload.id}`, {
    headers,
  });
}
