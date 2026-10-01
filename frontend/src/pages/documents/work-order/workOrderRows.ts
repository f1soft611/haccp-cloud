import type { WorkOrderRow, WorkOrderSearchValue } from './types';

// ponytail: 백엔드 API 전까지 화면 확인용 샘플 데이터
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
        rowState: 'saved',
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
        rowState: 'saved',
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
        rowState: 'saved',
    },
];

export function createEmptyWorkOrderRow(): WorkOrderRow {
    return {
        id: crypto.randomUUID(),
        itemName: '',
        productionDate: '',
        expiryDate: '',
        quantity: null,
        unit: '',
        spec: '',
        remark: '',
        rowState: 'new',
    };
}

// 신규 행은 아직 값이 비어 있을 수 있으므로 검색 조건과 무관하게 항상 표시한다.
export function filterWorkOrderRows(
    rows: WorkOrderRow[],
    search: WorkOrderSearchValue,
): WorkOrderRow[] {
    const keyword = search.itemName.trim();
    return rows.filter(
        (row) =>
            row.rowState === 'new' ||
            ((!search.startDate || row.productionDate >= search.startDate) &&
                (!search.endDate || row.productionDate <= search.endDate) &&
                (!keyword || row.itemName.includes(keyword))),
    );
}

// 오류가 있으면 첫 번째 오류 메시지, 없으면 null
export function validateWorkOrderRows(rows: WorkOrderRow[]): string | null {
    for (const row of rows) {
        if (row.rowState === 'saved') continue;
        const label = row.itemName.trim() || '신규 행';
        if (!row.itemName.trim()) return `${label}: 품명을 입력하세요.`;
        if (!row.productionDate) return `${label}: 생산일자를 입력하세요.`;
        if (!row.expiryDate) return `${label}: 소비기한을 입력하세요.`;
        if (row.quantity === null || row.quantity <= 0) {
            return `${label}: 생산량은 0보다 커야 합니다.`;
        }
        if (row.expiryDate < row.productionDate) {
            return `${label}: 소비기한은 생산일자 이후여야 합니다.`;
        }
    }
    return null;
}