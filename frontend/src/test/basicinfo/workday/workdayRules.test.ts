import { describe, expect, it } from 'vitest';
import type { WorkdayItem } from '../../../services/basicinfo/workday/workdayService';
import { isOffDay, isRedDay, summarizeMonth, applyChanges } from "../../../pages/basicinfo/workday/workdayRules.ts";

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
});