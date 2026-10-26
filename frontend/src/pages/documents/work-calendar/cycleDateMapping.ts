import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance, HaccpWorkExpiration } from '../../../services/documents/haccpBaseWorkService';
import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';

export type CalendarWorkEvent = {
    date: string;
    cycleDate: string;
    isFuture: boolean;
    item: TenantTodoCardItem;
    expiration?: HaccpWorkExpiration;
}

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

function parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// 인스턴스가 없으면 미작성(상태값 비움, 업무 경로)
function withCycleInstance(
    item: TenantTodoCardItem,
    instance: HaccpWorkCycleInstance | undefined,
): TenantTodoCardItem {
    return {
        ...item,
        title: instance?.title || item.divisionName || item.categoryName || '업무',
        // title: item.divisionName || item.categoryName || '업무',
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
    rangeStart: string,
    rangeEnd: string,
    cycleInstances: HaccpWorkCycleInstance[] = [],
    today: Date = new Date(),
    displayStartDate: string = '',
): CalendarWorkEvent[] {
    const todayString = toLocalDateString(today);
    const currentWeekMonday = toLocalDateString(
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - ((today.getDay() + 6) % 7),
        ),
    );
    const currentMonthFirst = toDateString(today.getFullYear(), today.getMonth(), 1);
    const currentYearFirst = toDateString(today.getFullYear(), 0, 1);
    // 표시 시작일이 속한 주기의 기준일 (이보다 이른 주기는 표시하지 않음, '' 이면 하한 없음)
    const displayStart = displayStartDate ? parseLocalDate(displayStartDate) : null;
    const minCycleDates: Record<string, string> = displayStart
        ? {
            DAY: displayStartDate,
            ANYTIME: displayStartDate,
            WEEK: toLocalDateString(
                new Date(
                    displayStart.getFullYear(),
                    displayStart.getMonth(),
                    displayStart.getDate() - ((displayStart.getDay() + 6) % 7),
                ),
            ),
            MONTH: toDateString(displayStart.getFullYear(), displayStart.getMonth(), 1),
            YEAR: toDateString(displayStart.getFullYear(), 0, 1),
        }
        : {};
    const instances = new Map(
        cycleInstances.map((instance) => [
            `${instance.workId}|${instance.cycleDate}`,
            instance,
        ]),
    );

    const days: string[] = [];
    const mondays: string[] = [];
    for (
        const cursor = parseLocalDate(rangeStart);
        toLocalDateString(cursor) <= rangeEnd;
        cursor.setDate(cursor.getDate() + 1)
    ) {
        days.push(toLocalDateString(cursor));
        if (cursor.getDay() === 1) {
            mondays.push(toLocalDateString(cursor));
        }
    }
    const monthFirsts = days.filter((date) => date.endsWith('-01'));
    const yearFirsts = days.filter((date) => date.endsWith('-01-01'));

    const events: CalendarWorkEvent[] = [];
    const push = (
        date: string,
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        // 기존 -> 보는 달 날짜만 표시 / 변경 -> 보이는 범위 안이면 표시
        if (date < rangeStart || date > rangeEnd) {
            return;
        }
        if (cycleDate < (minCycleDates[item.cycle] ?? '')) {
            return;
        }
        events.push({
            date,
            cycleDate,
            isFuture: cycleDate > currentCycleDate,
            item: withCycleInstance(item, instances.get(`${item.id}|${cycleDate}`)),
        });
    };

    // 지난 주기·진행 중 주기 상신 문서는 주기 시작일 칸, 진행 중 주기의 미작성·반려·임시저장만 오늘 칸
    const followsToday = (statusType: string) =>
        ['반려', '임시저장'].includes(
            resolveApprovalStatusView({ approvalStatusType: statusType }).label,
        );
    const displayDate = (
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        if (cycleDate !== currentCycleDate) {
            return cycleDate;
        }
        const instance = instances.get(`${item.id}|${cycleDate}`);
        // 상신 이후 문서는 주기 시작일 칸
        if (instance && !followsToday(instance.statusType)) {
            return cycleDate;
        }
        return todayString;
    };

    const pushCycles = (
        item: TenantTodoCardItem,
        cycleDates: string[],
        currentCycleDate: string,
    ) => {
        new Set([...cycleDates, currentCycleDate]).forEach((cycleDate) => {
            push(displayDate(item, cycleDate, currentCycleDate), item, cycleDate, currentCycleDate);
        });
    };

    items.forEach((item) => {
        // 기존 -> getWorkCycleLabel(item) 한글 라벨 비교 / 변경 -> reg_term 공통코드 비교
        const cycle = item.cycle;

        if (cycle === 'DAY') {
            days.forEach((date) => push(date, item, date, todayString));
            return;
        }

        if (cycle === 'WEEK') {
            pushCycles(item, mondays, currentWeekMonday);
            return;
        }

        if (cycle === 'MONTH') {
            pushCycles(item, monthFirsts, currentMonthFirst);
            return;
        }

        if (cycle === 'YEAR') {
            pushCycles(item, yearFirsts, currentYearFirst);
            return;
        }

        // 수시: 해야 할 날이 없으므로 작성한 문서만 작성일 칸에 표시 (문서 날짜를 현재 주기로 넘겨 미래 표시 안 함)
        if (cycle === 'ANYTIME') {
            cycleInstances
            .filter((instance) => instance.workId === item.id)
            .forEach((instance) => push(instance.cycleDate, item, instance.cycleDate, instance.cycleDate));
            return;
        }

        // 기존 -> ANYTIME(수시)·QUARTER·HALF는 고정 기준일 규칙이 없어 캘린더에 표시하지 않는다. (분기/반기 계산은 범위 밖)
        // 변경 -> QUARTER, HALF는 고정 기준일 규칙이 없어 캘린더에 표시하지 않는다. (분기/반기 계산은 범위 밖)
    });

    return events;
}

// 만료일 관리 업무: 결재 완료 문서의 만료일 칸에 표시
// 앞으로 올 만료일이 보여야 하므로 표시 시작일 하한은 적용하지 않고, 같은 대상 여러 문서도 모두 표시
export function mapExpirationsToCalendarEvents(
    todos: TenantTodoCardItem[],
    expirations: HaccpWorkExpiration[],
    rangeStart: string,
    rangeEnd: string,
    materialTypeName: (code: string) => string = (code) => code,
): CalendarWorkEvent[] {
    return expirations.flatMap((expiration) => {
        const item = todos.find((todo) => todo.id === expiration.workId);
        if (!item || expiration.expirationDate < rangeStart || expiration.expirationDate > rangeEnd) {
            return [];
        }
        const workName = item.divisionName || item.categoryName || '업무';
        const targetName = expiration.targetName || materialTypeName(expiration.materialType);
        return [{
            date: expiration.expirationDate,
            cycleDate: expiration.expirationDate,
            isFuture: false,
            item: { ...item, title: targetName ? `만료 | ${workName} - ${targetName}` : `만료 | ${workName}` },
            expiration,
        }];
    });
}