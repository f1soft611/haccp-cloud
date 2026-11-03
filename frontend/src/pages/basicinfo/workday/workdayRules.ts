import type { WorkdayItem, WorkdayType } from '../../../services/basicinfo/workday/workdayService';

// ponytail: 공통코드 그룹(WORKDAY_TYPE)이 아직 없어 상수 라벨. 그룹 등록 후 useCommonCodeOptions 로 교체
export const WORKDAY_TYPE_LABELS: Record<WorkdayType, string> = {
    WORK: '근무일',
    PUBLIC_HOLIDAY: '공휴일',
    COMPANY_HOLIDAY: '회사 휴일',
    SUBSTITUTE_HOLIDAY: '대체 휴일',
    SPECIAL_WORK: '특근일',
};

export const WORKDAY_TYPES = Object.keys(WORKDAY_TYPE_LABELS) as WorkdayType[];

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