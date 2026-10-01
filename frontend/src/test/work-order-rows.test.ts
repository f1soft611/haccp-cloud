import { describe, expect, it } from 'vitest';
import type { WorkOrderRow } from '../pages/documents/work-order/types';
import {
    createEmptyWorkOrderRow,
    filterWorkOrderRows,
    SAMPLE_WORK_ORDERS,
    validateWorkOrderRows,
} from '../pages/documents/work-order/workOrderRows';

const validNewRow = (): WorkOrderRow => ({
    ...createEmptyWorkOrderRow(),
    itemName: '열무김치',
    productionDate: '2026-10-01',
    expiryDate: '2026-10-31',
    quantity: 100,
});

describe('validateWorkOrderRows', () => {
    it('빈 신규 행은 품명 누락을 신규 행으로 알린다', () => {
        expect(validateWorkOrderRows([createEmptyWorkOrderRow()])).toBe(
            '신규 행: 품명을 입력하세요.',
        );
    });

    it('생산량이 비었거나 0 이하이면 오류', () => {
        expect(validateWorkOrderRows([{ ...validNewRow(), quantity: null }])).toBe(
            '열무김치: 생산량은 0보다 커야 합니다.',
        );
        expect(validateWorkOrderRows([{ ...validNewRow(), quantity: 0 }])).toBe(
            '열무김치: 생산량은 0보다 커야 합니다.',
        );
    });

    it('소비기한이 생산일자보다 빠르면 오류', () => {
        expect(
            validateWorkOrderRows([{ ...validNewRow(), expiryDate: '2026-09-30' }]),
        ).toBe('열무김치: 소비기한은 생산일자 이후여야 합니다.');
    });

    it('저장된 행은 검사하지 않고, 유효하면 null', () => {
        expect(validateWorkOrderRows([...SAMPLE_WORK_ORDERS, validNewRow()])).toBeNull();
    });
});

describe('filterWorkOrderRows', () => {
    it('품명/생산일자로 거르고 신규 행은 항상 남긴다', () => {
        const rows = [createEmptyWorkOrderRow(), ...SAMPLE_WORK_ORDERS];
        const result = filterWorkOrderRows(rows, {
            startDate: '2026-09-29',
            endDate: '2026-09-29',
            itemName: '',
        });
        expect(result.map((row) => row.itemName)).toEqual(['', '깍두기']);
    });
});