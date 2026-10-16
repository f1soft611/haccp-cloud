import type {WorkOrderItem, WorkOrderSaveValue} from "../../../services/documents/workOrderService.ts";

// 변경 -> tb_workdirect 연동, 서비스 타입(작업지시번호·품목ID 포함)을 그대로 사용
export type WorkOrderRow = WorkOrderItem;

// 변경 -> 작업지시번호는 서버 채번이므로 폼에서 제외
export type WorkOrderFormValue = WorkOrderSaveValue;

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