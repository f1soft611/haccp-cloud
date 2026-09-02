import { APP_LABELS } from '../../../shared/constants/labels';
import { getWorkCycleLabel } from '../../dashboard/tenant/utils';
import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';

export type CalendarWorkEvent = {
    date: string;
    item: TenantTodoCardItem;
};

const [DAILY, MONTHLY, WEEKLY, YEARLY] = APP_LABELS.dashboard.cycles;

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function toDateString(
    year: number,
    monthIndex0: number,
    day: number,
): string {
    return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

export function mapTodosToCalendarEvents(
    items: TenantTodoCardItem[],
    year: number,
    monthIndex0: number,
): CalendarWorkEvent[] {
    const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
    const events: CalendarWorkEvent[] = [];

    items.forEach((item) => {
        const cycleLabel = getWorkCycleLabel(item);

        if (cycleLabel === DAILY) {
            for (let day = 1; day <= daysInMonth; day += 1) {
                events.push({ date: toDateString(year, monthIndex0, day), item });
            }
            return;
        }

        if (cycleLabel === WEEKLY) {
            for (let day = 1; day <= daysInMonth; day += 1) {
                if (new Date(year, monthIndex0, day).getDay() === 1) {
                    events.push({ date: toDateString(year, monthIndex0, day), item });
                }
            }
            return;
        }

        if (cycleLabel === MONTHLY) {
            events.push({ date: toDateString(year, monthIndex0, 1), item });
            return;
        }

        if (cycleLabel === YEARLY) {
            if (monthIndex0 === 0) {
                events.push({ date: toDateString(year, monthIndex0, 1), item });
            }
            return;
        }

        // '발생시'(이벤트성) 업무는 고정 주기가 없어 캘린더에 표시하지 않는다.
    });

    return events;
}