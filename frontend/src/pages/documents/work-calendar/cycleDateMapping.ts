import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance } from '../../../services/documents/haccpBaseWorkService';
import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';

// 기존 -> { date, item }: 업무 1건(현재 주기 상태)을 모든 칸에 그대로 복사
// 변경 -> { date, cycleDate, isFuture, item }: 주기 기준일별 문서 상태를 붙이고 미래 여부 표시
export type CalendarWorkEvent = {
    date: string;
    cycleDate: string;
    isFuture: boolean;
    item: TenantTodoCardItem;
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
        // 기존 -> item.title(업무 단위, 결재 대기 문서 제목)을 모든 칸이 공유
        // 변경 -> 그 날짜 문서 제목, 문서가 없으면 업무명
        title: instance?.title || item.divisionName || item.categoryName || '업무',
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
        events.push({
            date,
            cycleDate,
            isFuture: cycleDate > currentCycleDate,
            item: withCycleInstance(item, instances.get(`${item.id}|${cycleDate}`)),
        });
    };

    // 기존 -> 진행 중인 주기는 등록 여부와 무관하게 오늘 칸, 나머지는 주기 시작일
    // 변경 -> 문서가 있으면 등록일 칸 (단, 진행 중 주기가 반려면 오늘 칸), 문서가 없으면 기존 규칙
    const followsToday = (statusType: string) =>
        ['반려', '임시저장'].includes(
            resolveApprovalStatusView({ approvalStatusType: statusType }).label,
        );
    const displayDate = (
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        const isCurrent = cycleDate === currentCycleDate;
        const instance = instances.get(`${item.id}|${cycleDate}`);
        if (instance?.registeredDate && !(isCurrent && followsToday(instance.statusType))) {
            return instance.registeredDate;
        }
        return isCurrent ? todayString : cycleDate;
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

        // ANYTIME(수시)·QUARTER·HALF는 고정 기준일 규칙이 없어 캘린더에 표시하지 않는다. (분기/반기 계산은 범위 밖)
    });

    return events;
}