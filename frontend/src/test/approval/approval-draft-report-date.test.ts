import { describe, expect, it } from 'vitest';
import {
    resolveApprovalTitle,
    toApprovalAutoTitle,
    toCycleStartDate,
} from '../../pages/documents/approvals/utils/approvalDraftUtils';

describe('toCycleStartDate', () => {
    it('일일 업무는 고른 날짜 그대로', () => {
        expect(toCycleStartDate('DAY', '2026-10-08')).toBe('2026-10-08');
    });

    it('주기 코드가 없으면 고른 날짜 그대로', () => {
        expect(toCycleStartDate('', '2026-10-08')).toBe('2026-10-08');
    });

    it('주간 업무는 그 주 월요일', () => {
        expect(toCycleStartDate('WEEK', '2026-10-08')).toBe('2026-10-05');
        expect(toCycleStartDate('WEEK', '2026-10-05')).toBe('2026-10-05');
    });

    it('주간 업무에 일요일을 고르면 앞 월요일', () => {
        expect(toCycleStartDate('WEEK', '2026-10-11')).toBe('2026-10-05');
    });

    it('월간 업무는 그 달 1일', () => {
        expect(toCycleStartDate('MONTH', '2026-10-22')).toBe('2026-10-01');
    });

    it('연간 업무는 그 해 1월 1일', () => {
        expect(toCycleStartDate('YEAR', '2026-10-22')).toBe('2026-01-01');
    });

    it('분기 업무는 그 분기 첫날', () => {
        expect(toCycleStartDate('QUARTER', '2026-08-20')).toBe('2026-07-01');
        expect(toCycleStartDate('QUARTER', '2026-03-31')).toBe('2026-01-01');
    });

    it('반기 업무는 1월 1일 또는 7월 1일', () => {
        expect(toCycleStartDate('HALF', '2026-06-30')).toBe('2026-01-01');
        expect(toCycleStartDate('HALF', '2026-10-22')).toBe('2026-07-01');
    });

    it('빈 값은 그대로', () => {
        expect(toCycleStartDate('WEEK', '')).toBe('');
    });
});

describe('toApprovalAutoTitle', () => {
    it('업무 기준일과 업무명을 밑줄로 잇는다', () => {
        expect(toApprovalAutoTitle('2026-11-01', '품질 점검')).toBe('2026-11-01_품질 점검');
    });

    it('업무 기준일이 없으면 빈 문자열', () => {
        expect(toApprovalAutoTitle('', '품질 점검')).toBe('');
    });

    it('업무명이 없으면 빈 문자열', () => {
        expect(toApprovalAutoTitle('2026-11-01', '')).toBe('');
    });
});

describe('resolveApprovalTitle', () => {
    const base = {
        initialTitle: '2026-11-02_품질 점검',
        autoTitle: '2026-11-02_품질 점검',
        previousAutoTitle: '2026-11-01_품질 점검',
    };

    it('빈 제목은 초기 제목으로 채운다', () => {
        expect(resolveApprovalTitle({ ...base, current: '' })).toBe('2026-11-02_품질 점검');
        expect(resolveApprovalTitle({ ...base, current: '   ' })).toBe('2026-11-02_품질 점검');
    });

    it('빈 제목이면 자동 제목보다 저장된 제목이 우선', () => {
        expect(
            resolveApprovalTitle({ ...base, current: '', initialTitle: '저장된 제목' }),
        ).toBe('저장된 제목');
    });

    it('이전 자동 제목 그대로면 새 자동 제목을 따라간다', () => {
        expect(resolveApprovalTitle({ ...base, current: '2026-11-01_품질 점검' })).toBe(
            '2026-11-02_품질 점검',
        );
    });

    it('사용자가 고친 제목은 유지한다', () => {
        expect(resolveApprovalTitle({ ...base, current: '직접 입력한 제목' })).toBe('직접 입력한 제목');
    });

    it('기준일을 지워 자동 제목이 없으면 제목을 유지한다', () => {
        expect(
            resolveApprovalTitle({
                ...base,
                current: '2026-11-01_품질 점검',
                autoTitle: '',
            }),
        ).toBe('2026-11-01_품질 점검');
    });
});