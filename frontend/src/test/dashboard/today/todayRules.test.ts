import { describe, expect, it } from 'vitest';
import {formatElapsed, getCycleDueDate, getDueBadge} from "../../../pages/dashboard/today/todayRules.ts";

// 2026-10-28 은 수요일
const WED = new Date(2026, 9, 28, 10, 30);

describe('getCycleDueDate', () => {
    it('일일은 오늘', () => {
        expect(getCycleDueDate('DAY', WED)).toBe('2026-10-28');
    });

    it('주간은 월요일 시작 주의 일요일', () => {
        expect(getCycleDueDate('WEEK', WED)).toBe('2026-11-01');
        expect(getCycleDueDate('WEEK', new Date(2026, 10, 1))).toBe('2026-11-01');
        expect(getCycleDueDate('WEEK', new Date(2026, 10, 2))).toBe('2026-11-08');
    });

    it('월간은 말일 (2월 포함)', () => {
        expect(getCycleDueDate('MONTH', WED)).toBe('2026-10-31');
        expect(getCycleDueDate('MONTH', new Date(2026, 1, 10))).toBe('2026-02-28');
    });

    it('분기, 반기, 연간은 각 기간 말일', () => {
        expect(getCycleDueDate('QUARTER', new Date(2026, 1, 10))).toBe('2026-03-31');
        expect(getCycleDueDate('QUARTER', WED)).toBe('2026-12-31');
        expect(getCycleDueDate('HALF', new Date(2026, 2, 1))).toBe('2026-06-30');
        expect(getCycleDueDate('HALF', WED)).toBe('2026-12-31');
        expect(getCycleDueDate('YEAR', new Date(2026, 2, 1))).toBe('2026-12-31');
    });
});

describe('getDueBadge', () => {
    it('오늘이 마감이면 오늘 마감', () => {
        expect(getDueBadge('2026-10-28', WED)).toEqual({ label: '오늘 마감', color: 'error' });
    });

    it('3일 이내는 주황, 그 이후는 회색', () => {
        expect(getDueBadge('2026-10-29', WED)).toEqual({ label: 'D-1', color: 'warning' });
        expect(getDueBadge('2026-10-31', WED)).toEqual({ label: 'D-3', color: 'warning' });
        expect(getDueBadge('2026-11-01', WED)).toEqual({ label: 'D-4', color: 'default' });
    });
});

describe('formatElapsed', () => {
    it('빈 값은 -', () => {
        expect(formatElapsed('', WED)).toBe('-');
        expect(formatElapsed(undefined, WED)).toBe('-');
    });

    it('오늘, 어제, n일 전 (시간이 붙어도 날짜만 봄)', () => {
        expect(formatElapsed('2026-10-28 09:00', WED)).toBe('오늘');
        expect(formatElapsed('2026-10-27', WED)).toBe('어제');
        expect(formatElapsed('2026-09-29', WED)).toBe('29일 전');
    });
});