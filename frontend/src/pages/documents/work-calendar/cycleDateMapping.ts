import type { TenantTodoCardItem } from '../../dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance, HaccpWorkExpiration } from '../../../services/documents/haccpBaseWorkService';
import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import {
    nextCycleStart,
    toCycleStartDate,
    toWorkCycleAnchor,
    type WorkCycleAnchor,
} from '../../../shared/utils/workCycleDates';

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

// 주기 시작일 ~ 다음 주기 시작일 전날 중 첫 근무일, 없으면 시작일 (백엔드는 주기 업무를 업무일과 무관하게 셈)
function firstWorkDate(
    cycle: string,
    cycleDate: string,
    isWorkDate: (date: string) => boolean,
    anchor?: WorkCycleAnchor,
): string {
    const end = nextCycleStart(cycle, cycleDate, anchor);
    for (const cursor = parseLocalDate(cycleDate); toLocalDateString(cursor) < end; cursor.setDate(cursor.getDate() + 1)) {
        const date = toLocalDateString(cursor);
        if (isWorkDate(date)) {
            return date;
        }
    }
    return cycleDate;
}

// [rangeStart, rangeEnd] 안에서 시작하는 주기 시작일 (기준 업무는 업무 시작일부터)
function cycleStartsInRange(
    cycle: string,
    rangeStart: string,
    rangeEnd: string,
    anchor?: WorkCycleAnchor,
): string[] {
    const starts: string[] = [];
    let cursor = toCycleStartDate(cycle, rangeStart, anchor) || anchor?.startDate || '';
    if (cursor && cursor < rangeStart) {
        cursor = nextCycleStart(cycle, cursor, anchor);
    }
    while (cursor && cursor <= rangeEnd) {
        starts.push(cursor);
        cursor = nextCycleStart(cycle, cursor, anchor);
    }
    return starts;
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
    // 근무일 판정 (업무일 미생성일도 false). 기본값은 모든 날 근무일
    isWorkDate: (date: string) => boolean = () => true,
): CalendarWorkEvent[] {
    const todayString = toLocalDateString(today);

    // 업무별 주기 기준 (업무 시작일이 없으면 undefined = 기존 달력 기준)
    const anchorByWorkId = new Map(items.map((item) => [item.id, toWorkCycleAnchor(item)]));
    // 표시 하한: 업무 시작일이 있으면 그 날(첫 주기), 없으면 표시 시작일이 속한 주기 ('' 이면 하한 없음)
    const minCycleDate = (item: TenantTodoCardItem) => {
        const anchor = anchorByWorkId.get(item.id);
        if (anchor) {
            return anchor.startDate;
        }
        return displayStartDate ? toCycleStartDate(item.cycle, displayStartDate) : '';
    };

    // report_date 는 표시일이라 업무 주기 시작일로 바꿔 키를 만든다. 같은 주기 여러 건이면 표시일이 늦은 문서가 남는다
    const cycleByWorkId = new Map(items.map((item) => [item.id, item.cycle]));
    // 만료일관리 업무 문서는 문서마다 따로 그리므로 주기 키에서 뺀다
    const expirationWorkIds = new Set(items.filter((item) => item.expirationApply).map((item) => item.id));
    const instances = new Map(
        cycleInstances
        .filter((instance) => !expirationWorkIds.has(instance.workId))
        .map((instance) => [
            `${instance.workId}|${toCycleStartDate(cycleByWorkId.get(instance.workId) ?? '', instance.cycleDate, anchorByWorkId.get(instance.workId))}`,
            instance,
        ]),
    );

    const days: string[] = [];
    for (
        const cursor = parseLocalDate(rangeStart);
        toLocalDateString(cursor) <= rangeEnd;
        cursor.setDate(cursor.getDate() + 1)
    ) {
        days.push(toLocalDateString(cursor));
    }

    const events: CalendarWorkEvent[] = [];
    const push = (
        date: string,
        item: TenantTodoCardItem,
        cycleDate: string,
        currentCycleDate: string,
    ) => {
        // 보이는 범위 안이면 표시
        if (date < rangeStart || date > rangeEnd) {
            return;
        }
        // 작성 문서가 있는 주기는 입사일 이전이어도 표시, 빈 주기 칸만 숨김
        if (cycleDate < minCycleDate(item) && !instances.has(`${item.id}|${cycleDate}`)) {
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
        const instance = instances.get(`${item.id}|${cycleDate}`);
        if (cycleDate !== currentCycleDate) {
            // 기존 -> return instance?.cycleDate ?? cycleDate; / 변경 -> 문서 없으면 주기 안의 첫 근무일 칸
            return instance?.cycleDate ?? firstWorkDate(item.cycle, cycleDate, isWorkDate, anchorByWorkId.get(item.id));
        }
        // 상신 이후 문서는 문서 표시일 칸
        if (instance && !followsToday(instance.statusType)) {
            return instance.cycleDate;
        }
        return todayString;
    };

    // 주기 시작일이 범위 앞이어도 표시일이 범위 안일 수 있어 문서들의 주기 시작일도 돌림
    const pushCycles = (
        item: TenantTodoCardItem,
        cycleDates: string[],
        currentCycleDate: string,
    ) => {
        const anchor = anchorByWorkId.get(item.id);
        const instanceCycleDates = cycleInstances
        .filter((instance) => instance.workId === item.id)
        .map((instance) => toCycleStartDate(item.cycle, instance.cycleDate, anchor));
        // 업무 시작일 이전(현재 주기 없음)이면 '' 가 섞이므로 뺀다
        new Set([...cycleDates, ...instanceCycleDates, currentCycleDate].filter(Boolean)).forEach((cycleDate) => {
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

        // 사용안함 업무: 앞으로 작성할 주기 칸 없이 작성 문서만 문서마다 report_date 칸에
        if (!item.active) {
            cycleInstances
            .filter((instance) => instance.workId === item.id)
            .forEach((instance) => {
                if (instance.cycleDate < rangeStart || instance.cycleDate > rangeEnd) {
                    return;
                }
                events.push({
                    date: instance.cycleDate,
                    cycleDate: instance.cycleDate,
                    isFuture: false,
                    item: withCycleInstance(item, instance),
                });
            });
            return;
        }

        // 기존 -> getWorkCycleLabel(item) 한글 라벨 비교 / 변경 -> reg_term 공통코드 비교
        const cycle = item.cycle;

        if (cycle === 'DAY') {
            // 기존 -> days.forEach((date) => push(date, item, date, todayString));
            // 변경 -> 근무일 칸만, 근무일이 아니어도 작성 문서가 있으면 표시
            days
            .filter((date) => isWorkDate(date) || instances.has(`${item.id}|${date}`))
            .forEach((date) => push(date, item, date, todayString));
            return;
        }

        // 기존 -> WEEK/MONTH/YEAR/QUARTER/HALF 마다 달력 고정 시작일 목록 / 변경 -> 업무 시작일 기준까지 반영해 주기 시작일 생성
        if (['WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR'].includes(cycle)) {
            const anchor = anchorByWorkId.get(item.id);
            pushCycles(item, cycleStartsInRange(cycle, rangeStart, rangeEnd, anchor), toCycleStartDate(cycle, todayString, anchor));
            return;
        }

        // 수시: 해야 할 날이 없으므로 작성한 문서만 작성일 칸에 표시 (문서 날짜를 현재 주기로 넘겨 미래 표시 안 함)
        if (cycle === 'ANYTIME') {
            cycleInstances
            .filter((instance) => instance.workId === item.id)
            .forEach((instance) => push(instance.cycleDate, item, instance.cycleDate, instance.cycleDate));
            return;
        }
    });

    return events;
}

// 만료일 관리 업무: 결재 완료 문서의 만료일 칸에 표시
// 서버가 업무 + 대상별 최신 문서만 내려 주므로 받은 행을 그대로 표시. 표시 시작일 하한은 적용하지 않음
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