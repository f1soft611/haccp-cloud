import type { WorkOrderFormValue, WorkOrderRow, WorkOrderSearchValue } from './types';

// ponytail: 백엔드 API 전까지 화면 확인용 샘플 데이터
// 기존 -> 각 샘플에 rowState: 'saved'
// 변경 -> rowState 제거
export const SAMPLE_WORK_ORDERS: WorkOrderRow[] = [
    {
        id: 'wo-1',
        itemName: '배추김치',
        productionDate: '2026-09-28',
        expiryDate: '2026-10-28',
        quantity: 500,
        unit: 'kg',
        spec: '10kg/박스',
        remark: '',
    },
    {
        id: 'wo-2',
        itemName: '깍두기',
        productionDate: '2026-09-29',
        expiryDate: '2026-10-29',
        quantity: 200,
        unit: 'kg',
        spec: '5kg/박스',
        remark: '',
    },
    {
        id: 'wo-3',
        itemName: '총각김치',
        productionDate: '2026-09-30',
        expiryDate: '2026-10-30',
        quantity: 150,
        unit: 'kg',
        spec: '5kg/박스',
        remark: '시즌 한정',
    },
];

// 기존 -> createEmptyWorkOrderRow(): 그리드 신규 행 생성
// 변경 -> 다이얼로그에서 등록하므로 제거

// 기존 -> rowState === 'new' 행은 검색 조건과 무관하게 항상 표시
// 변경 -> 신규 행 개념이 없으므로 조건만으로 필터
export function filterWorkOrderRows(
    rows: WorkOrderRow[],
    search: WorkOrderSearchValue,
): WorkOrderRow[] {
    const keyword = search.itemName.trim();
    return rows.filter(
        (row) =>
            (!search.startDate || row.productionDate >= search.startDate) &&
            (!search.endDate || row.productionDate <= search.endDate) &&
            (!keyword || row.itemName.includes(keyword)),
    );
}

export type WorkOrderFormErrors = Partial<Record<keyof WorkOrderFormValue, string>>;

// 기존 -> validateWorkOrderRows(rows): 미저장 행을 돌며 첫 오류 메시지 하나 반환
// 변경 -> 다이얼로그 한 건의 필드별 오류 반환 (없으면 빈 객체)
export function validateWorkOrderForm(value: WorkOrderFormValue): WorkOrderFormErrors {
    const errors: WorkOrderFormErrors = {};
    if (!value.itemName.trim()) errors.itemName = '품명을 입력하세요.';
    if (!value.productionDate) errors.productionDate = '생산일자를 입력하세요.';
    if (!value.expiryDate) {
        errors.expiryDate = '소비기한을 입력하세요.';
    } else if (value.productionDate && value.expiryDate < value.productionDate) {
        errors.expiryDate = '소비기한은 생산일자 이후여야 합니다.';
    }
    if (value.quantity === null || value.quantity <= 0) {
        errors.quantity = '생산량은 0보다 커야 합니다.';
    }
    return errors;
}