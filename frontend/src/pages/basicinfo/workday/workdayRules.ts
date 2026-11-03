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