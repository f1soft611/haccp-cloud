import { apiClient } from '../api/apiClient';

type ResultEnvelope<T> = {
  result?: T;
};

export type CustomerItem = {
  id: string;
  customerCode: string;
  customerName: string;
  custNameAbbr: string;
  presidentName: string;
  businessNo: string;
  juridNo: string;
  businessStatus1: string;
  businessItem1: string;
  postCode: string;
  address: string;
  telephoneNo: string;
  facsimileNo: string;
  custMemo: string;
  active: boolean;
};

export type ListCustomersPagedParams = {
  tenantCode?: string;
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  filterActive?: 'all' | 'Y' | 'N';
};

export type ListCustomersPagedResult = {
  items: CustomerItem[];
  totalCount: number;
};

export type CreateCustomerRequest = {
  tenantCode?: string;
  customerName: string;
  custNameAbbr: string;
  presidentName: string;
  businessNo: string;
  juridNo: string;
  businessStatus1: string;
  businessItem1: string;
  postCode: string;
  address: string;
  telephoneNo: string;
  facsimileNo: string;
  custMemo: string;
  active: boolean;
};

export type UpdateCustomerRequest = CreateCustomerRequest & {
  id: string;
};

type RawCustomerItem = Partial<{
  customerId: string | number;
  customerCode: string;
  customerName: string;
  custNameAbbr: string;
  presidentName: string;
  businessNo: string;
  juridNo: string;
  businessStatus1: string;
  businessItem1: string;
  postCode: string;
  address: string;
  telephoneNo: string;
  facsimileNo: string;
  custMemo: string;
  active: boolean;
}>;

type CustomersPagedResult = {
  items?: RawCustomerItem[];
  totalCount?: number;
};

type CustomerItemResult = {
  item?: RawCustomerItem;
};

function normalizeCustomerItem(raw: RawCustomerItem): CustomerItem {
  return {
    id: String(raw.customerId ?? ''),
    customerCode: String(raw.customerCode ?? ''),
    customerName: String(raw.customerName ?? ''),
    custNameAbbr: String(raw.custNameAbbr ?? ''),
    presidentName: String(raw.presidentName ?? ''),
    businessNo: String(raw.businessNo ?? ''),
    juridNo: String(raw.juridNo ?? ''),
    businessStatus1: String(raw.businessStatus1 ?? ''),
    businessItem1: String(raw.businessItem1 ?? ''),
    postCode: String(raw.postCode ?? ''),
    address: String(raw.address ?? ''),
    telephoneNo: String(raw.telephoneNo ?? ''),
    facsimileNo: String(raw.facsimileNo ?? ''),
    custMemo: String(raw.custMemo ?? ''),
    active: Boolean(raw.active),
  };
}

export async function listCustomersPaged(
  params: ListCustomersPagedParams,
): Promise<ListCustomersPagedResult> {
  const headers = params.tenantCode
    ? { 'x-tenant-code': params.tenantCode }
    : undefined;

  const { data } = await apiClient.get<ResultEnvelope<CustomersPagedResult>>(
    '/v1/basicinfo/customers/paged',
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
    items: (data?.result?.items ?? []).map(normalizeCustomerItem),
    totalCount: data?.result?.totalCount ?? 0,
  };
}

export async function createCustomer(
  payload: CreateCustomerRequest,
): Promise<CustomerItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.post<ResultEnvelope<CustomerItemResult>>(
    '/v1/basicinfo/customers',
    {
      customerName: payload.customerName,
      custNameAbbr: payload.custNameAbbr,
      presidentName: payload.presidentName,
      businessNo: payload.businessNo,
      juridNo: payload.juridNo,
      businessStatus1: payload.businessStatus1,
      businessItem1: payload.businessItem1,
      postCode: payload.postCode,
      address: payload.address,
      telephoneNo: payload.telephoneNo,
      facsimileNo: payload.facsimileNo,
      custMemo: payload.custMemo,
      active: payload.active,
    },
    { headers },
  );
  return normalizeCustomerItem(data?.result?.item ?? {});
}

export async function updateCustomer(
  payload: UpdateCustomerRequest,
): Promise<CustomerItem> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  const { data } = await apiClient.put<ResultEnvelope<CustomerItemResult>>(
    `/v1/basicinfo/customers/${payload.id}`,
    {
      customerName: payload.customerName,
      custNameAbbr: payload.custNameAbbr,
      presidentName: payload.presidentName,
      businessNo: payload.businessNo,
      juridNo: payload.juridNo,
      businessStatus1: payload.businessStatus1,
      businessItem1: payload.businessItem1,
      postCode: payload.postCode,
      address: payload.address,
      telephoneNo: payload.telephoneNo,
      facsimileNo: payload.facsimileNo,
      custMemo: payload.custMemo,
      active: payload.active,
    },
    { headers },
  );
  return normalizeCustomerItem(data?.result?.item ?? {});
}

export async function deleteCustomer(payload: {
  tenantCode?: string;
  id: string;
}): Promise<void> {
  const headers = payload.tenantCode
    ? { 'x-tenant-code': payload.tenantCode }
    : undefined;

  await apiClient.delete(`/v1/basicinfo/customers/${payload.id}`, {
    headers,
  });
}
