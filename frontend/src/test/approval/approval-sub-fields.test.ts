import { describe, expect, it } from 'vitest';
import {
    calcNextCalibDate,
    EMPTY_APPROVAL_SUB,
    getApprovalSubFieldConfig,
    getApprovalSubTargetKey,
    validateApprovalSub,
} from '../../pages/documents/approvals/utils/approvalSubFields';
import { toApprovalSubRequest } from '../../services/documents/haccpBaseWorkService';

describe('getApprovalSubFieldConfig', () => {
    it('4개 HCP 분류코드만 설정을 돌려준다', () => {
        expect(getApprovalSubFieldConfig('HCP-CALIB')?.target).toBe('equipment');
        expect(getApprovalSubFieldConfig('HCP-VALID')?.target).toBe('materialType');
        expect(getApprovalSubFieldConfig('HCP-SQI')?.inspectedLabel).toBe('자가품질 검사일');
        expect(getApprovalSubFieldConfig(' HCP-HCERT ')?.target).toBe('user');
        expect(getApprovalSubFieldConfig('HCP-ETC')).toBeUndefined();
        expect(getApprovalSubFieldConfig('HA')).toBeUndefined();
        expect(getApprovalSubFieldConfig(undefined)).toBeUndefined();
    });

    it('대상 종류별로 값 키가 정해진다', () => {
        expect(getApprovalSubTargetKey(getApprovalSubFieldConfig('HCP-CALIB')!)).toBe('equipmentId');
        expect(getApprovalSubTargetKey(getApprovalSubFieldConfig('HCP-SQI')!)).toBe('materialType');
        expect(getApprovalSubTargetKey(getApprovalSubFieldConfig('HCP-HCERT')!)).toBe('certificationUserId');
    });
});

describe('validateApprovalSub', () => {
    const calib = getApprovalSubFieldConfig('HCP-CALIB')!;

    it('대상이나 날짜가 비어 있으면 필수값 문구', () => {
        expect(validateApprovalSub(calib, EMPTY_APPROVAL_SUB)).toBe('필수값을 입력하세요.');
        expect(
            validateApprovalSub(calib, {
                ...EMPTY_APPROVAL_SUB,
                materialType: 'RAW',
                inspectedDate: '2026-10-01',
                expirationDate: '2027-10-01',
            }),
        ).toBe('필수값을 입력하세요.');
    });

    it('검사일이 만료일보다 늦으면 오류 문구', () => {
        expect(
            validateApprovalSub(calib, {
                ...EMPTY_APPROVAL_SUB,
                equipmentId: '501',
                inspectedDate: '2027-10-02',
                expirationDate: '2027-10-01',
            }),
        ).toBe('만료일은 검사일 이후여야 합니다.');
    });

    it('필수값이 모두 있으면 빈 문자열', () => {
        expect(
            validateApprovalSub(calib, {
                ...EMPTY_APPROVAL_SUB,
                equipmentId: '501',
                inspectedDate: '2026-10-01',
                expirationDate: '2026-10-01',
            }),
        ).toBe('');
    });
});

describe('toApprovalSubRequest', () => {
    it('id 는 숫자로, 빈 값은 undefined 로 바꾼다', () => {
        expect(
            toApprovalSubRequest({
                ...EMPTY_APPROVAL_SUB,
                equipmentId: '501',
                inspectedDate: '2026-10-01',
                expirationDate: '2027-10-01',
            }),
        ).toEqual({
            equipmentId: 501,
            materialType: undefined,
            certificationUserId: undefined,
            inspectedDate: '2026-10-01',
            expirationDate: '2027-10-01',
        });
        expect(toApprovalSubRequest(undefined)).toBeUndefined();
    });
});

describe('calcNextCalibDate', () => {
    it.each([
        ['2026-01-15', 12, '2027-01-14'],
        ['2026-01-31', 1, '2026-02-27'],
        ['2026-03-01', 1, '2026-03-31'],
        ['2027-02-28', 12, '2028-02-27'],
        ['2028-02-29', 12, '2029-02-27'],
        ['2026-11-15', 3, '2027-02-14'],
    ])('%s + %i개월 - 1일 = %s', (inspectedDate, cycleMonths, expected) => {
        expect(calcNextCalibDate(inspectedDate, cycleMonths)).toBe(expected);
    });
});