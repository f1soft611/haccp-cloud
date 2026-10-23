import { describe, expect, it } from 'vitest';
import type { WorkOrderFormValue } from '../../../pages/documents/work-order/types';
import {
    calcExpiryDate,
    validateWorkOrderForm,
} from '../../../pages/documents/work-order/workOrderRows';

// 기존 -> itemName 직접 입력 기준 샘플 값 / filterWorkOrderRows 테스트
// 변경 -> 품목 선택(materialId) 기준, 필터는 서버 조회로 대체되어 테스트 제거
const validValue = (): WorkOrderFormValue => ({
    materialId: 'm-1',
    itemName: '배추김치',
    productionDate: '2026-10-01',
    expiryDate: '2026-10-31',
    quantity: 100,
    unit: 'kg',
    spec: '10kg/박스',
    remark: '',
    expiryedStatus: 'NONE',
    expiryedCount: null,
});

describe('validateWorkOrderForm', () => {
    it('필수값이 비면 필드별 오류를 돌려준다', () => {
        expect(
            validateWorkOrderForm({
                ...validValue(),
                materialId: '',
                productionDate: '',
                expiryDate: '',
                quantity: null,
            }),
        ).toEqual({
            materialId: '품목을 선택하세요.',
            productionDate: '생산계획일을 입력하세요.',
            expiryDate: '소비기한을 입력하세요.',
            quantity: '생산량은 0보다 커야 합니다.',
        });
    });

    it('생산량이 0 이하이면 오류', () => {
        expect(validateWorkOrderForm({ ...validValue(), quantity: 0 })).toEqual({
            quantity: '생산량은 0보다 커야 합니다.',
        });
    });

    it('소비기한이 생산계획일보다 빠르면 오류', () => {
        expect(validateWorkOrderForm({ ...validValue(), expiryDate: '2026-09-30' })).toEqual({
            expiryDate: '소비기한은 생산계획일 이후여야 합니다.',
        });
    });

    it('비고가 255자를 넘으면 오류', () => {
        expect(validateWorkOrderForm({ ...validValue(), remark: 'a'.repeat(256) })).toEqual({
            remark: '비고는 255자 이하로 입력하세요.',
        });
    });

    it('유효하면 빈 객체', () => {
        expect(validateWorkOrderForm(validValue())).toEqual({});
    });
});

describe('calcExpiryDate', () => {
    it('DAY 30 이면 30일 뒤', () => {
        expect(calcExpiryDate('2026-10-23', 'DAY', 30)).toBe('2026-11-22');
    });

    it('MONTH 12 이면 12개월 뒤', () => {
        expect(calcExpiryDate('2026-10-23', 'MONTH', 12)).toBe('2027-10-23');
    });

    it('MONTH 1 인데 다음 달에 같은 날이 없으면 그 달 말일', () => {
        expect(calcExpiryDate('2026-01-31', 'MONTH', 1)).toBe('2026-02-28');
    });

    it('YEAR 1 이면 윤년 2/29 는 다음 해 2/28', () => {
        expect(calcExpiryDate('2028-02-29', 'YEAR', 1)).toBe('2029-02-28');
    });

    it('기준이 NONE 이면 생산계획일 + 1년', () => {
        expect(calcExpiryDate('2026-10-15', 'NONE', null)).toBe('2027-10-15');
    });

    it('기준이 있어도 숫자가 없으면 생산계획일 + 1년', () => {
        expect(calcExpiryDate('2026-10-15', 'MONTH', null)).toBe('2027-10-15');
    });

    it('생산계획일이 비면 빈 문자열', () => {
        expect(calcExpiryDate('', 'MONTH', 6)).toBe('');
    });
});