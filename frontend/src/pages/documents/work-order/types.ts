// 기존 -> export type WorkOrderRowState = 'saved' | 'new' | 'modified';  (WorkOrderRow.rowState 로 셀 편집 상태 추적)
// 변경 -> 다이얼로그 저장 시 즉시 반영하므로 행 상태 제거, 폼 값 타입 추가
export type WorkOrderRow = {
    id: string;
    itemName: string;
    productionDate: string;
    expiryDate: string;
    quantity: number | null;
    unit: string;
    spec: string;
    remark: string;
};

export type WorkOrderFormValue = Omit<WorkOrderRow, 'id'>;

export type WorkOrderSearchValue = {
    startDate: string;
    endDate: string;
    itemName: string;
};

export const EMPTY_WORK_ORDER_SEARCH: WorkOrderSearchValue = {
    startDate: '',
    endDate: '',
    itemName: '',
};