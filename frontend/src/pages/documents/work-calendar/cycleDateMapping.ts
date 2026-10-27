import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance, HaccpWorkExpiration } from '../../../services/documents/haccpBaseWorkService';
import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import { toCycleStartDate } from '../approvals/utils/approvalDraftUtils';

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
    materialTypeName: (code: string) => string = (code) => code,
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
    const currentQuarterFirst = toDateString(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const currentHalfFirst = toDateString(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1);
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
            QUARTER: toDateString(displayStart.getFullYear(), Math.floor(displayStart.getMonth() / 3) * 3, 1),
            HALF: toDateString(displayStart.getFullYear(), displayStart.getMonth() < 6 ? 0 : 6, 1),
            YEAR: toDateString(displayStart.getFullYear(), 0, 1),
        }
        : {};
    // 기존 -> 키: workId|instance.cycleDate (report_date 가 곧 주기 시작일)
    // 변경 -> report_date 는 표시일이라 업무 주기 시작일로 바꿔 키를 만든다. 같은 주기 여러 건이면 표시일이 늦은 문서가 남는다
    const cycleByWorkId = new Map(items.map((item) => [item.id, item.cycle]));
    // 기존 -> 모든 문서로 키를 만듦
    // 변경 -> 만료일관리 업무 문서는 문서마다 따로 그리므로 주기 키에서 뺀다
    const expirationWorkIds = new Set(items.filter((item) => item.expirationApply).map((item) => item.id));
    const instances = new Map(
        cycleInstances
        .filter((instance) => !expirationWorkIds.has(instance.workId))
        .map((instance) => [
            `${instance.workId}|${toCycleStartDate(cycleByWorkId.get(instance.workId) ?? '', instance.cycleDate)}`,
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
    const quarterFirsts = monthFirsts.filter((date) => ['01', '04', '07', '10'].includes(date.slice(5, 7)));
    const halfFirsts = monthFirsts.filter((date) => ['01', '07'].includes(date.slice(5, 7)));

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
    // 기존 -> 지난 주기와 상신 이후 문서는 cycleDate(주기 시작일) 칸
    // 변경 -> 문서가 있으면 문서 표시일(report_date) 칸, 없으면 주기 시작일 칸
    const displayDate = (
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        const instance = instances.get(`${item.id}|${cycleDate}`);
        if (cycleDate !== currentCycleDate) {
            return instance?.cycleDate ?? cycleDate;
        }
        // 상신 이후 문서는 문서 표시일 칸
        if (instance && !followsToday(instance.statusType)) {
            return instance.cycleDate;
        }
        return todayString;
    };

    // 기존 -> 보이는 범위의 주기 시작일 + 현재 주기만 돌림
    // 변경 -> 주기 시작일이 범위 앞이어도 표시일이 범위 안일 수 있어 문서들의 주기 시작일도 돌림
    const pushCycles = (
        item: TenantTodoCardItem,
        cycleDates: string[],
        currentCycleDate: string,
    ) => {
        const instanceCycleDates = cycleInstances
        .filter((instance) => instance.workId === item.id)
        .map((instance) => toCycleStartDate(item.cycle, instance.cycleDate));
        new Set([...cycleDates, ...instanceCycleDates, currentCycleDate]).forEach((cycleDate) => {
            push(displayDate(item, cycleDate, currentCycleDate), item, cycleDate, currentCycleDate);
        });
    };

    items.forEach((item) => {
        // 만료일관리 업무: 주기 칸 없이 작성 문서만 문서마다 report_date 칸에 (표시 시작일 하한 없음)
        if (item.expirationApply) {
            const workName = item.divisionName || item.categoryName || '업무';
            cycleInstances
            .filter((instance) => instance.workId === item.id)
            .forEach((instance) => {
                if (instance.cycleDate < rangeStart || instance.cycleDate > rangeEnd) {
                    return;
                }
                const targetName = instance.targetName || materialTypeName(instance.materialType);
                events.push({
                    date: instance.cycleDate,
                    cycleDate: instance.cycleDate,
                    isFuture: false,
                    item: {
                        ...withCycleInstance(item, instance),
                        title: targetName ? `${workName} - ${targetName}` : workName,
                    },
                });
            });
            return;
        }

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

        if (cycle === 'QUARTER') {
            pushCycles(item, quarterFirsts, currentQuarterFirst);
            return;
        }

        if (cycle === 'HALF') {
            pushCycles(item, halfFirsts, currentHalfFirst);
            return;
        }

        // 수시: 해야 할 날이 없으므로 작성한 문서만 작성일 칸에 표시 (문서 날짜를 현재 주기로 넘겨 미래 표시 안 함)
        if (cycle === 'ANYTIME') {
            cycleInstances
            .filter((instance) => instance.workId === item.id)
            .forEach((instance) => push(instance.cycleDate, item, instance.cycleDate, instance.cycleDate));
            return;
        }

        // QUARTER(1, 4, 7, 10월 1일), HALF(1, 7월 1일)도 위에서 표시한다.
    });

    return events;
}

// 만료일 관리 업무: 결재 완료 문서의 만료일 칸에 표시
// 기존 -> 같은 대상 여러 문서도 모두 표시
// 변경 -> 서버가 업무 + 대상별 최신 문서만 내려 주므로 받은 행을 그대로 표시. 표시 시작일 하한은 적용하지 않음
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