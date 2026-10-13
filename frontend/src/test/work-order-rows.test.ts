import { describe, expect, it } from 'vitest';
import type { WorkOrderFormValue } from '../pages/documents/work-order/types';
import {
    filterWorkOrderRows,
    SAMPLE_WORK_ORDERS,
    validateWorkOrderForm,
} from '../pages/documents/work-order/workOrderRows';

const validValue = (): WorkOrderFormValue => ({
    itemName: '열무김치',
    productionDate: '2026-10-01',
    expiryDate: '2026-10-31',
    quantity: 100,
    unit: 'kg',
    spec: '',
    remark: '',
});

describe('validateWorkOrderForm', () => {
    it('필수값이 비면 필드별 오류를 돌려준다', () => {
        expect(
            validateWorkOrderForm({
                ...validValue(),
                itemName: '  ',
                productionDate: '',
                expiryDate: '',
                quantity: null,
            }),
        ).toEqual({
            itemName: '품명을 입력하세요.',
            productionDate: '생산일자를 입력하세요.',
            expiryDate: '소비기한을 입력하세요.',
            quantity: '생산량은 0보다 커야 합니다.',
        });
    });

    it('생산량이 0 이하이면 오류', () => {
        expect(validateWorkOrderForm({ ...validValue(), quantity: 0 })).toEqual({
            quantity: '생산량은 0보다 커야 합니다.',
        });
    });

    it('소비기한이 생산일자보다 빠르면 오류', () => {
        expect(validateWorkOrderForm({ ...validValue(), expiryDate: '2026-09-30' })).toEqual({
            expiryDate: '소비기한은 생산일자 이후여야 합니다.',
        });
    });

    it('유효하면 빈 객체', () => {
        expect(validateWorkOrderForm(validValue())).toEqual({});
    });
});

describe('filterWorkOrderRows', () => {
    it('생산일자 기간으로 거른다', () => {
        const result = filterWorkOrderRows(SAMPLE_WORK_ORDERS, {
            startDate: '2026-09-29',
            endDate: '2026-09-29',
            itemName: '',
        });
        expect(result.map((row) => row.itemName)).toEqual(['깍두기']);
    });

    it('품명 부분일치로 거른다', () => {
        const result = filterWorkOrderRows(SAMPLE_WORK_ORDERS, {
            startDate: '',
            endDate: '',
            itemName: '김치',
        });
        expect(result.map((row) => row.itemName)).toEqual(['배추김치', '총각김치']);
    });
});