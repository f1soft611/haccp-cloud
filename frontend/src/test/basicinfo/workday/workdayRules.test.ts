import { describe, expect, it } from 'vitest';
import type { WeekItem, WorkdayItem } from '../../../services/basicinfo/workday/workdayService';
import {
    isOffDay,
    isRedDay,
    dayColor,
    summarizeMonth,
    applyChanges,
    currentMonthRange,
    yearsInRange,
    filterByRange,
    findWeek,
} from "../../../pages/basicinfo/workday/workdayRules.ts";

function day(workdayDate: string, dayType: WorkdayItem['dayType']): WorkdayItem {
    return { workdayDate, dayType, dayName: '', memo: '', source: 'PATTERN' };
}

describe('workdayRules', () => {
    it('근무일과 특근일만 영업일로 본다', () => {
        expect(isOffDay('WORK')).toBe(false);
        expect(isOffDay('SPECIAL_WORK')).toBe(false);
        expect(isOffDay('PUBLIC_HOLIDAY')).toBe(true);
        expect(isOffDay('COMPANY_HOLIDAY')).toBe(true);
        expect(isOffDay('SUBSTITUTE_HOLIDAY')).toBe(true);
    });

    it('공휴일과 대체휴일만 빨간 날이다', () => {
        expect(isRedDay('PUBLIC_HOLIDAY')).toBe(true);
        expect(isRedDay('SUBSTITUTE_HOLIDAY')).toBe(true);
        expect(isRedDay('COMPANY_HOLIDAY')).toBe(false);
    });

    it('리스트 색: 공휴일 빨강 > 토요일 파랑 > 일요일/회사휴일 빨강', () => {
        expect(dayColor('2026-11-07', 'COMPANY_HOLIDAY')).toBe('blue'); // 토
        expect(dayColor('2026-11-07', 'PUBLIC_HOLIDAY')).toBe('red'); // 토
        expect(dayColor('2026-11-07', 'WORK')).toBe('blue'); // 토
        expect(dayColor('2026-11-08', 'WORK')).toBe('red'); // 일
        expect(dayColor('2026-11-04', 'PUBLIC_HOLIDAY')).toBe('red'); // 수
        expect(dayColor('2026-11-04', 'COMPANY_HOLIDAY')).toBe('red'); // 수
        expect(dayColor('2026-11-04', 'WORK')).toBeNull(); // 수
    });

    it('해당 월만 골라 영업일/휴무일을 센다', () => {
        const items = [
            day('2026-01-31', 'COMPANY_HOLIDAY'),
            day('2026-02-01', 'COMPANY_HOLIDAY'),
            day('2026-02-02', 'WORK'),
            day('2026-02-03', 'SPECIAL_WORK'),
            day('2026-02-17', 'PUBLIC_HOLIDAY'),
            day('2026-03-01', 'WORK'),
        ];
        expect(summarizeMonth(items, 2026, 2)).toEqual({ workDays: 2, offDays: 2 });
    });

    it('변경분이 있는 날짜만 덮어쓴다', () => {
        const items = [day('2026-02-02', 'WORK'), day('2026-02-03', 'WORK')];
        const changed = { ...day('2026-02-03', 'COMPANY_HOLIDAY'), source: 'MANUAL' as const };
        expect(applyChanges(items, { '2026-02-03': changed })).toEqual([items[0], changed]);
    });

    it('이번 달 1일부터 말일까지를 기본 기간으로 잡는다', () => {
        expect(currentMonthRange(new Date(2026, 10, 3))).toEqual({
            start: '2026-11-01',
            end: '2026-11-30',
        });
        expect(currentMonthRange(new Date(2028, 1, 10))).toEqual({
            start: '2028-02-01',
            end: '2028-02-29',
        });
    });

    it('기간이 걸친 연도를 모두 돌려준다', () => {
        expect(yearsInRange('2026-11-01', '2026-11-30')).toEqual([2026]);
        expect(yearsInRange('2026-12-15', '2028-01-15')).toEqual([2026, 2027, 2028]);
        expect(yearsInRange('2026-12-15', '2026-01-01')).toEqual([]);
    });

    it('기간 안의 날짜만 남기고 날짜순으로 정렬한다', () => {
        const items = [
            day('2027-01-01', 'PUBLIC_HOLIDAY'),
            day('2026-12-31', 'WORK'),
            day('2026-12-30', 'WORK'),
            day('2027-01-02', 'COMPANY_HOLIDAY'),
        ];
        expect(filterByRange(items, '2026-12-31', '2027-01-01').map((item) => item.workdayDate)).toEqual([
            '2026-12-31',
            '2027-01-01',
        ]);
    });

    it('날짜가 들어 있는 주차를 찾는다', () => {
        const weeks: WeekItem[] = [
            { year: 2026, week: 53, fromDate: '2026-12-28', toDate: '2027-01-03' },
            { year: 2027, week: 1, fromDate: '2027-01-04', toDate: '2027-01-10' },
        ];
        expect(findWeek(weeks, '2026-12-28')?.week).toBe(53);
        expect(findWeek(weeks, '2027-01-02')).toEqual(weeks[0]);
        expect(findWeek(weeks, '2027-01-10')?.week).toBe(1);
        expect(findWeek(weeks, '2027-01-11')).toBeUndefined();
    });
});