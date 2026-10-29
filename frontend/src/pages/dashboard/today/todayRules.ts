import dayjs from 'dayjs';
import type { TenantTodoCardItem } from '../tenant/hooks/useTenantDashboardData';
import { getTodoStatusLabel } from '../tenant/todoFilter';
import type { CalendarWorkEvent } from '../../documents/work-calendar/cycleDateMapping';
import type { HaccpWorkExpiration } from '../../../services/documents/haccpBaseWorkService';

const DATE_FORMAT = 'YYYY-MM-DD';

export type DueBadge = {
    label: string;
    color: 'error' | 'warning' | 'default';
    variant: 'filled' | 'outlined';
};

// 이번 주기의 마지막 날. 주간은 월요일 시작이라 일요일이 마감
export function getCycleDueDate(cycle: string, today: Date): string {
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOf = (monthExclusive: number) =>
        dayjs(new Date(year, monthExclusive, 0)).format(DATE_FORMAT);

    switch (cycle) {
        case 'WEEK':
            return dayjs(today).add(6 - ((today.getDay() + 6) % 7), 'day').format(DATE_FORMAT);
        case 'MONTH':
            return lastDayOf(month + 1);
        case 'QUARTER':
            return lastDayOf(Math.floor(month / 3) * 3 + 3);
        case 'HALF':
            return lastDayOf(month < 6 ? 6 : 12);
        case 'YEAR':
            return lastDayOf(12);
        default:
            return dayjs(today).format(DATE_FORMAT);
    }
}

export function getDueBadge(dueDate: string, today: Date): DueBadge {
    const days = dayjs(dueDate).diff(dayjs(today).startOf('day'), 'day');
    if (days < 0) {
        return { label: `D+${-days}`, color: 'error', variant: 'filled' };
    }
    if (days === 0) {
        return { label: '오늘마감', color: 'error', variant: 'outlined' };
    }
    return { label: `D-${days}`, color: days <= 3 ? 'warning' : 'default', variant: 'filled' };
}

export function formatElapsed(value: string | undefined, today: Date): string {
    if (!value) {
        return '-';
    }
    const days = dayjs(today).startOf('day').diff(dayjs(value.slice(0, 10)), 'day');
    if (days <= 0) {
        return '오늘';
    }
    return days === 1 ? '어제' : `${days}일 전`;
}

export type TodoBoardKind = 'write' | 'rejected' | 'done' | 'skip';

// 기존 -> TenantTodoCardItem & { dueDate } / 변경 -> 만료 건이면 만료 문서 정보도 들고 있음
export type WriteTodo = TenantTodoCardItem & { dueDate: string; expiration?: HaccpWorkExpiration };

// 만료일 관리 건은 만료일 30일 전부터 작성할 업무에 넣는다
export const EXPIRATION_LEAD_DAYS = 30;

export type TodayBoardData = {
    write: WriteTodo[];
    rejected: TenantTodoCardItem[];
    doneCount: number;
};

export function workName(item: TenantTodoCardItem): string {
    return item.divisionName || item.title || '-';
}

export function compareByCategory(left: TenantTodoCardItem, right: TenantTodoCardItem): number {
    return (
        (left.categorySortOrder ?? 0) - (right.categorySortOrder ?? 0) ||
        workName(left).localeCompare(workName(right), 'ko')
    );
}

// 상태 라벨은 이번 주기 문서 기준. 수시는 해야 할 날이 없고, 사용안함은 더 쓰지 않으므로 보드에서 뺀다
// 기존 -> 수시, 사용안함만 skip / 변경 -> 만료일 관리 업무도 skip (캘린더처럼 주기 칸 없이 만료 건으로 따로 넣음)
export function classifyTodo(item: TenantTodoCardItem): TodoBoardKind {
    if (item.cycle === 'ANYTIME' || !item.active || item.expirationApply) {
        return 'skip';
    }
    const label = getTodoStatusLabel(item);
    if (label === '반려') {
        return 'rejected';
    }
    return label === '미작성' || label === '임시저장' ? 'write' : 'done';
}

// 기존 -> buildBoard(todos, today) / 변경 -> 만료일 관리 건(expirations)도 받아 작성할 업무에 합침
export function buildBoard(
    todos: TenantTodoCardItem[],
    today: Date,
    expirations: HaccpWorkExpiration[] = [],
    materialTypeName: (code: string) => string = (code) => code,
): TodayBoardData {
    const write: WriteTodo[] = [];
    const rejected: TenantTodoCardItem[] = [];
    let doneCount = 0;

    todos.forEach((item) => {
        const kind = classifyTodo(item);
        if (kind === 'write') {
            write.push({ ...item, dueDate: getCycleDueDate(item.cycle, today) });
        } else if (kind === 'rejected') {
            rejected.push(item);
        } else if (kind === 'done') {
            doneCount += 1;
        }
    });

    // 서버가 업무 + 대상별 최신 결재 완료 문서만 내려 주므로 갱신 전인 건만 남아 있다
    const expirationEnd = dayjs(today).add(EXPIRATION_LEAD_DAYS, 'day').format(DATE_FORMAT);
    expirations.forEach((expiration) => {
        const item = todos.find((todo) => todo.id === expiration.workId);
        if (!item || expiration.expirationDate > expirationEnd) {
            return;
        }
        const name = item.divisionName || item.categoryName || '업무';
        const targetName = expiration.targetName || materialTypeName(expiration.materialType);
        write.push({
            ...item,
            title: targetName ? `${name} - ${targetName}` : name,
            dueDate: expiration.expirationDate,
            expiration,
        });
    });

    write.sort((left, right) => left.dueDate.localeCompare(right.dueDate) || compareByCategory(left, right));
    rejected.sort(compareByCategory);
    return { write, rejected, doneCount };
}

export type HistoryCell = {
    cycleDate: string;
    label: string;
};

// 캘린더 이벤트(주기마다 1건)에서 업무별 최근 limit 개 주기 상태를 뽑는다. 마지막 칸이 이번 주기
export function buildHistoryByWork(
    events: CalendarWorkEvent[],
    limit = 7,
): Map<string, HistoryCell[]> {
    const byWork = new Map<string, HistoryCell[]>();
    events
    .filter((event) => !event.isFuture && !event.expiration)
    .forEach((event) => {
        const cells = byWork.get(event.item.id) ?? [];
        cells.push({ cycleDate: event.cycleDate, label: getTodoStatusLabel(event.item) });
        byWork.set(event.item.id, cells);
    });
    byWork.forEach((cells, workId) => {
        byWork.set(
            workId,
            cells.sort((left, right) => left.cycleDate.localeCompare(right.cycleDate)).slice(-limit),
        );
    });
    return byWork;
}