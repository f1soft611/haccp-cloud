export type WorkOrderRowState = 'saved' | 'new' | 'modified';

export type WorkOrderRow = {
    id: string;
    itemName: string;
    productionDate: string;
    expiryDate: string;
    quantity: number | null;
    unit: string;
    spec: string;
    remark: string;
    rowState: WorkOrderRowState;
};

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