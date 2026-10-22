import { describe, expect, it } from 'vitest';
import { toCycleStartDate } from '../../pages/documents/approvals/utils/approvalDraftUtils';

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

    it('빈 값은 그대로', () => {
        expect(toCycleStartDate('WEEK', '')).toBe('');
    });
});