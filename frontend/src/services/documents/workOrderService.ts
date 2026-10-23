import { apiClient } from '../api/apiClient';

// 입력 오류(INPUT_CHECK_ERROR)는 HTTP 200 + resultCode 900 으로 내려오므로 직접 확인한다
type ResultEnvelope<T> = {
    resultCode?: number | string;
    resultMessage?: string;
    result?: T & { message?: string };
};

function unwrapResult<T>(data: ResultEnvelope<T> | undefined): T | undefined {
    if (data?.resultCode !== undefined && Number(data.resultCode) !== 200) {
        throw new Error(data.result?.message || data.resultMessage || '요청을 처리하지 못했습니다.');
    }
    return data?.result;
}

export type WorkOrderItem = {
    id: string;
    workdtNo: string;
    materialId: string;
    itemName: string;
    productionDate: string;
    expiryDate: string;
    quantity: number | null;
    unit: string;
    spec: string;
    remark: string;
    expiryedStatus: string;
    expiryedCount: number | null;
};

export type WorkOrderSaveValue = Omit<WorkOrderItem, 'id' | 'workdtNo'>;

export type ListWorkOrdersPagedParams = {
    tenantCode?: string;
    pageIndex: number;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    keyword?: string;
};

export type ListWorkOrdersPagedResult = {
    items: WorkOrderItem[];
    totalCount: number;
};

type RawWorkOrderItem = Partial<{
    workdirectId: string | number;
    workdtNo: string;
    materialId: string | number;
    materialName: string;
    prodPlanDate: string;
    expirationDate: string;
    prodplanQty: number | string | null;
    unit: string;
    materialSpec: string;
    prodMemo: string;
    expiryedStatus: string;
    expiryedCount: number | string | null;
}>;

function normalizeWorkOrderItem(raw: RawWorkOrderItem): WorkOrderItem {
    const qty = raw.prodplanQty === null || raw.prodplanQty === undefined || raw.prodplanQty === ''
        ? null
        : Number(raw.prodplanQty);
    return {
        id: String(raw.workdirectId ?? ''),
        workdtNo: String(raw.workdtNo ?? ''),
        materialId: String(raw.materialId ?? ''),
        itemName: String(raw.materialName ?? ''),
        productionDate: String(raw.prodPlanDate ?? ''),
        expiryDate: String(raw.expirationDate ?? ''),
        quantity: qty !== null && Number.isFinite(qty) ? qty : null,
        unit: String(raw.unit ?? ''),
        spec: String(raw.materialSpec ?? ''),
        remark: String(raw.prodMemo ?? ''),
        expiryedStatus: String(raw.expiryedStatus || 'NONE'),
        expiryedCount:
            raw.expiryedCount === null || raw.expiryedCount === undefined || raw.expiryedCount === ''
                ? null
                : Number(raw.expiryedCount),
    };
}

function tenantHeaders(tenantCode?: string) {
    return tenantCode ? { 'x-tenant-code': tenantCode } : undefined;
}

function toRequestBody(value: WorkOrderSaveValue) {
    return {
        materialId: Number(value.materialId),
        prodPlanDate: value.productionDate,
        expirationDate: value.expiryDate,
        prodplanQty: value.quantity,
        prodMemo: value.remark,
    };
}

export async function listWorkOrdersPaged(
    params: ListWorkOrdersPagedParams,
): Promise<ListWorkOrdersPagedResult> {
    const { data } = await apiClient.get<
        ResultEnvelope<{ items?: RawWorkOrderItem[]; totalCount?: number }>
    >('/v1/documents/work-orders/paged', {
        headers: tenantHeaders(params.tenantCode),
        params: {
            pageIndex: params.pageIndex,
            pageSize: params.pageSize,
            startDate: params.startDate || undefined,
            endDate: params.endDate || undefined,
            keyword: params.keyword || undefined,
        },
    });
    const result = unwrapResult(data);
    return {
        items: (result?.items ?? []).map(normalizeWorkOrderItem),
        totalCount: result?.totalCount ?? 0,
    };
}

export async function createWorkOrder(
    payload: WorkOrderSaveValue & { tenantCode?: string },
): Promise<WorkOrderItem> {
    const { data } = await apiClient.post<ResultEnvelope<{ item?: RawWorkOrderItem }>>(
        '/v1/documents/work-orders',
        toRequestBody(payload),
        { headers: tenantHeaders(payload.tenantCode) },
    );
    return normalizeWorkOrderItem(unwrapResult(data)?.item ?? {});
}

export async function updateWorkOrder(
    payload: WorkOrderSaveValue & { tenantCode?: string; id: string },
): Promise<WorkOrderItem> {
    const { data } = await apiClient.put<ResultEnvelope<{ item?: RawWorkOrderItem }>>(
        `/v1/documents/work-orders/${payload.id}`,
        toRequestBody(payload),
        { headers: tenantHeaders(payload.tenantCode) },
    );
    return normalizeWorkOrderItem(unwrapResult(data)?.item ?? {});
}

export async function deleteWorkOrder(payload: { tenantCode?: string; id: string }): Promise<void> {
    const { data } = await apiClient.delete<ResultEnvelope<object>>(
        `/v1/documents/work-orders/${payload.id}`,
        { headers: tenantHeaders(payload.tenantCode) },
    );
    unwrapResult(data);
}