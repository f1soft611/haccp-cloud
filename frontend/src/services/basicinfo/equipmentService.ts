import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

export type EquipmentItem = {
  id: string;
  equipSysCd: string;
  equipCd: string;
  equipNm: string;
  equipKind: string;
  purDate: string;
  purCust: string;
  makCust: string;
  equipSpec: string;
  location: string;
  bigo: string;
  active: boolean;
};

export type ListEquipmentPagedParams = {
  tenantCode?: string;
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  filterActive?: 'all' | 'Y' | 'N';
};

export type ListEquipmentPagedResult = {
  items: EquipmentItem[];
  totalCount: number;
};

export type CreateEquipmentRequest = {
  tenantCode?: string;
  equipCd: string;
  equipNm: string;
  equipKind: string;
  purDate: string;
  purCust: string;
  makCust: string;
  equipSpec: string;
  location: string;
  bigo: string;
  active: boolean;
};

export type UpdateEquipmentRequest = CreateEquipmentRequest & {
  id: string;
};

type RawEquipmentItem = Partial<{
  equipmentId: string | number;
  equipSysCd: string;
  equipCd: string;
  equipNm: string;
  equipKind: string;
  purDate: string;
  purCust: string;
  makCust: string;
  equipSpec: string;
  location: string;
  bigo: string;
  active: boolean;
}>;

type EquipmentPagedResult = {
  items?: RawEquipmentItem[];
  totalCount?: number;
};

type EquipmentItemResult = {
  item?: RawEquipmentItem;
};

function normalizeEquipmentItem(raw: RawEquipmentItem): EquipmentItem {
  return {
    id: String(raw.equipmentId ?? ''),
    equipSysCd: String(raw.equipSysCd ?? ''),
    equipCd: String(raw.equipCd ?? ''),
    equipNm: String(raw.equipNm ?? ''),
    equipKind: String(raw.equipKind ?? ''),
    purDate: String(raw.purDate ?? ''),
    purCust: String(raw.purCust ?? ''),
    makCust: String(raw.makCust ?? ''),
    equipSpec: String(raw.equipSpec ?? ''),
    location: String(raw.location ?? ''),
    bigo: String(raw.bigo ?? ''),
    active: Boolean(raw.active),
  };
}

export async function listEquipmentPaged(
  params: ListEquipmentPagedParams,
): Promise<ListEquipmentPagedResult> {
  const headers = params.tenantCode
    ? { 'x-tenant-code': params.tenantCode }
    : undefined;

  const { data } = await apiClient.get<ResultEnvelope<EquipmentPagedResult>>(
    '/v1/basicinfo/equipment/paged',
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
    items: (data?.result?.items ?? []).map(normalizeEquipmentItem),
    totalCount: data?.result?.totalCount ?? 0,
  };
}

export async function createEquipment(
  payload: CreateEquipmentRequest,
): Promise<EquipmentItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.post<ResultEnvelope<EquipmentItemResult>>(
    '/v1/basicinfo/equipment',
    {
      equipCd: payload.equipCd,
      equipNm: payload.equipNm,
      equipKind: payload.equipKind,
      purDate: payload.purDate,
      purCust: payload.purCust,
      makCust: payload.makCust,
      equipSpec: payload.equipSpec,
      location: payload.location,
      bigo: payload.bigo,
      active: payload.active,
    },
    { headers },
  );
  return normalizeEquipmentItem(data?.result?.item ?? {});
}

export async function updateEquipment(
  payload: UpdateEquipmentRequest,
): Promise<EquipmentItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.put<ResultEnvelope<EquipmentItemResult>>(
    `/v1/basicinfo/equipment/${payload.id}`,
    {
      equipCd: payload.equipCd,
      equipNm: payload.equipNm,
      equipKind: payload.equipKind,
      purDate: payload.purDate,
      purCust: payload.purCust,
      makCust: payload.makCust,
      equipSpec: payload.equipSpec,
      location: payload.location,
      bigo: payload.bigo,
      active: payload.active,
    },
    { headers },
  );
  return normalizeEquipmentItem(data?.result?.item ?? {});
}

export async function deleteEquipment(payload: {
  tenantCode?: string;
  id: string;
}): Promise<void> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  await apiClient.delete(`/v1/basicinfo/equipment/${payload.id}`, {
    headers,
  });
}
