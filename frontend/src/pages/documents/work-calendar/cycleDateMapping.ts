import { APP_LABELS } from '../../../shared/constants/labels';
import { getWorkCycleLabel } from '../../dashboard/tenant/utils';
import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance } from '../../../services/documents/haccpBaseWorkService';

// 기존 -> { date, item }: 업무 1건(현재 주기 상태)을 모든 칸에 그대로 복사
// 변경 -> { date, cycleDate, isFuture, item }: 주기 기준일별 문서 상태를 붙이고 미래 여부 표시
export type CalendarWorkEvent = {
    date: string;
    cycleDate: string;
    isFuture: boolean;
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

function toLocalDateString(date: Date): string {
    return toDateString(date.getFullYear(), date.getMonth(), date.getDate());
}

// 인스턴스가 없으면 미작성(상태값 비움, 업무 경로)
function withCycleInstance(
    item: TenantTodoCardItem,
    instance: HaccpWorkCycleInstance | undefined,
): TenantTodoCardItem {
    return {
        ...item,
        approvalId: instance?.approvalId ?? '',
        approvalStatusType: instance?.statusType ?? '',
        approvalStatusTypeName: '',
        todoStatus: 'DRAFT',
        status: 'DRAFT',
        writtenInCycle: Boolean(instance),
        routeIdType: instance ? 'approval' : 'work',
        routeId: instance?.approvalId ?? item.id,
    };
}

export function mapTodosToCalendarEvents(
    items: TenantTodoCardItem[],
    year: number,
    monthIndex0: number,
    cycleInstances: HaccpWorkCycleInstance[] = [],
    today: Date = new Date(),
): CalendarWorkEvent[] {
    const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
    const monthPrefix = `${year}-${pad2(monthIndex0 + 1)}-`;
    const todayString = toLocalDateString(today);
    const isTodayInMonth = todayString.startsWith(monthPrefix);
    const currentWeekMonday = toLocalDateString(
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - ((today.getDay() + 6) % 7),
        ),
    );
    const currentMonthFirst = toDateString(today.getFullYear(), today.getMonth(), 1);
    const currentYearFirst = toDateString(today.getFullYear(), 0, 1);
    const instances = new Map(
        cycleInstances.map((instance) => [
            `${instance.workId}|${instance.cycleDate}`,
            instance,
        ]),
    );

    const mondays: string[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
        if (new Date(year, monthIndex0, day).getDay() === 1) {
            mondays.push(toDateString(year, monthIndex0, day));
        }
    }
    // 이번 주 월요일이 이전 달이어도 이번 주 업무는 오늘 칸에 표시한다.
    if (isTodayInMonth && !mondays.includes(currentWeekMonday)) {
        mondays.unshift(currentWeekMonday);
    }

    const events: CalendarWorkEvent[] = [];
    const push = (
        date: string,
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        if (!date.startsWith(monthPrefix)) {
            return;
        }
        events.push({
            date,
            cycleDate,
            isFuture: cycleDate > currentCycleDate,
            item: withCycleInstance(item, instances.get(`${item.id}|${cycleDate}`)),
        });
    };

    items.forEach((item) => {
        const cycleLabel = getWorkCycleLabel(item);

        if (cycleLabel === DAILY) {
            for (let day = 1; day <= daysInMonth; day += 1) {
                const date = toDateString(year, monthIndex0, day);
                push(date, item, date, todayString);
            }
            return;
        }

        // 진행 중인 주기(이번 주/이번 달)는 오늘 칸, 나머지는 주기 시작일(월요일/1일)에 표시
        if (cycleLabel === WEEKLY) {
            mondays.forEach((monday) => {
                push(
                    monday === currentWeekMonday ? todayString : monday,
                    item,
                    monday,
                    currentWeekMonday,
                );
            });
            return;
        }

        if (cycleLabel === MONTHLY) {
            const firstDay = toDateString(year, monthIndex0, 1);
            push(isTodayInMonth ? todayString : firstDay, item, firstDay, currentMonthFirst);
            return;
        }

        if (cycleLabel === YEARLY) {
            if (monthIndex0 === 0) {
                const firstDay = toDateString(year, 0, 1);
                push(firstDay, item, firstDay, currentYearFirst);
            }
            return;
        }

        // '발생시'(이벤트성) 업무는 고정 주기가 없어 캘린더에 표시하지 않는다.
    });

    return events;
}