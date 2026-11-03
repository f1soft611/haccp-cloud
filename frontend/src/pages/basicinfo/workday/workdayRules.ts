import dayjs from 'dayjs';
import type { WorkdayItem, WorkdayType } from '../../../services/basicinfo/workday/workdayService';

export function isOffDay(dayType: WorkdayType): boolean {
    return dayType !== 'WORK' && dayType !== 'SPECIAL_WORK';
}

export function isRedDay(dayType: WorkdayType): boolean {
    return dayType === 'PUBLIC_HOLIDAY' || dayType === 'SUBSTITUTE_HOLIDAY';
}

export type MonthSummary = { workDays: number; offDays: number };

// month: 1~12
export function summarizeMonth(items: WorkdayItem[], year: number, month: number): MonthSummary {
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    const monthItems = items.filter((item) => item.workdayDate.startsWith(prefix));
    const offDays = monthItems.filter((item) => isOffDay(item.dayType)).length;
    return { workDays: monthItems.length - offDays, offDays };
}

export function applyChanges(
    items: WorkdayItem[],
    changes: Record<string, WorkdayItem>,
): WorkdayItem[] {
    return items.map((item) => changes[item.workdayDate] ?? item);
}

export type DateRange = { start: string; end: string };

export function currentMonthRange(today: Date): DateRange {
    const base = dayjs(today);
    return {
        start: base.startOf('month').format('YYYY-MM-DD'),
        end: base.endOf('month').format('YYYY-MM-DD'),
    };
}

// start/end: YYYY-MM-DD
export function yearsInRange(start: string, end: string): number[] {
    const from = Number(start.slice(0, 4));
    const to = Number(end.slice(0, 4));
    const years: number[] = [];
    for (let year = from; year <= to; year += 1) {
        years.push(year);
    }
    return years;
}

// YYYY-MM-DD 문자열이라 사전순 비교가 날짜 비교와 같음
export function filterByRange(items: WorkdayItem[], start: string, end: string): WorkdayItem[] {
    return items
    .filter((item) => item.workdayDate >= start && item.workdayDate <= end)
    .sort((a, b) => a.workdayDate.localeCompare(b.workdayDate));
}