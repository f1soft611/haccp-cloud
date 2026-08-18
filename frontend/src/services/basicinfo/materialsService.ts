import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

export const MATERIAL_ITEM_TYPES = [
  '제품',
  '상품',
  '원재료',
  '부재료',
  '소모품',
] as const;

export type MaterialItem = {
  id: string;
  materialCode: string;
  materialName: string;
  itemType: string;
  materialSpec: string;
  materialWeight: number | null;
  unit: string;
  etc: string;
};

export type ListMaterialsPagedParams = {
  tenantCode?: string;
  pageIndex: number;
  pageSize: number;
  keyword?: string;
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
  etc: string;
}>;

type MaterialsPagedResult = {
  items?: RawMaterialItem[];
  totalCount?: number;
};

type MaterialItemResult = {
  item?: RawMaterialItem;
};

function normalizeMaterialItem(raw: RawMaterialItem): MaterialItem {
  const weight = raw.materialWeight;
  const normalizedWeight =
    weight === null || weight === undefined || weight === ''
      ? null
      : Number(weight);

  return {
    id: String(raw.materialId ?? ''),
    materialCode: String(raw.materialCode ?? ''),
    materialName: String(raw.materialName ?? ''),
    itemType: String(raw.itemType ?? ''),
    materialSpec: String(raw.materialSpec ?? ''),
    materialWeight:
      normalizedWeight !== null && Number.isFinite(normalizedWeight)
        ? normalizedWeight
        : null,
    unit: String(raw.unit ?? ''),
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
