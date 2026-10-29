import { describe, expect, it } from 'vitest';
import {
    buildBoard,
    classifyTodo,
    formatElapsed,
    getCycleDueDate,
    getDueBadge,
    buildHistoryByWork,
} from "../../../pages/dashboard/today/todayRules.ts";
import type {TenantTodoCardItem} from "../../../pages/dashboard/tenant/hooks/useTenantDashboardData.ts";
import type {CalendarWorkEvent} from "../../../pages/documents/work-calendar/cycleDateMapping.ts";

function todo(partial: Partial<TenantTodoCardItem>): TenantTodoCardItem {
    return {
        id: 'w1',
        title: '업무',
        divisionName: '업무',
        cycle: 'DAY',
        active: true,
        status: 'DRAFT',
        todoStatus: 'DRAFT',
        writtenInCycle: false,
        categorySortOrder: 0,
        ...partial,
    } as TenantTodoCardItem;
}

// 2026-10-28 은 수요일
const WED = new Date(2026, 9, 28, 10, 30);

describe('getCycleDueDate', () => {
    it('일일은 오늘', () => {
        expect(getCycleDueDate('DAY', WED)).toBe('2026-10-28');
    });

    it('주간은 월요일 시작 주의 일요일', () => {
        expect(getCycleDueDate('WEEK', WED)).toBe('2026-11-01');
        expect(getCycleDueDate('WEEK', new Date(2026, 10, 1))).toBe('2026-11-01');
        expect(getCycleDueDate('WEEK', new Date(2026, 10, 2))).toBe('2026-11-08');
    });

    it('월간은 말일 (2월 포함)', () => {
        expect(getCycleDueDate('MONTH', WED)).toBe('2026-10-31');
        expect(getCycleDueDate('MONTH', new Date(2026, 1, 10))).toBe('2026-02-28');
    });

    it('분기, 반기, 연간은 각 기간 말일', () => {
        expect(getCycleDueDate('QUARTER', new Date(2026, 1, 10))).toBe('2026-03-31');
        expect(getCycleDueDate('QUARTER', WED)).toBe('2026-12-31');
        expect(getCycleDueDate('HALF', new Date(2026, 2, 1))).toBe('2026-06-30');
        expect(getCycleDueDate('HALF', WED)).toBe('2026-12-31');
        expect(getCycleDueDate('YEAR', new Date(2026, 2, 1))).toBe('2026-12-31');
    });
});

describe('getDueBadge', () => {
    it('지난 마감은 D+N 빨간 채움', () => {
        expect(getDueBadge('2026-10-27', WED)).toEqual({ label: 'D+1', color: 'error', variant: 'filled' });
        expect(getDueBadge('2026-10-20', WED)).toEqual({ label: 'D+8', color: 'error', variant: 'filled' });
    });

    it('오늘 마감은 빨간 테두리', () => {
        expect(getDueBadge('2026-10-28', WED)).toEqual({ label: '오늘마감', color: 'error', variant: 'outlined' });
    });

    it('3일 이내는 주황, 그 이후는 회색', () => {
        expect(getDueBadge('2026-10-29', WED)).toEqual({ label: 'D-1', color: 'warning', variant: 'filled' });
        expect(getDueBadge('2026-10-31', WED)).toEqual({ label: 'D-3', color: 'warning', variant: 'filled' });
        expect(getDueBadge('2026-11-01', WED)).toEqual({ label: 'D-4', color: 'default', variant: 'filled' });
    });
});

describe('formatElapsed', () => {
    it('빈 값은 -', () => {
        expect(formatElapsed('', WED)).toBe('-');
        expect(formatElapsed(undefined, WED)).toBe('-');
    });

    it('오늘, 어제, n일 전 (시간이 붙어도 날짜만 봄)', () => {
        expect(formatElapsed('2026-10-28 09:00', WED)).toBe('오늘');
        expect(formatElapsed('2026-10-27', WED)).toBe('어제');
        expect(formatElapsed('2026-09-29', WED)).toBe('29일 전');
    });
});

describe('classifyTodo', () => {
    it('미작성과 임시저장은 작성할 업무', () => {
        expect(classifyTodo(todo({}))).toBe('write');
        expect(classifyTodo(todo({ approvalStatusTypeName: '임시저장', writtenInCycle: true }))).toBe('write');
    });

    it('반려는 반려 칸', () => {
        expect(classifyTodo(todo({ approvalStatusType: 'rejected', writtenInCycle: true }))).toBe('rejected');
    });

    it('결재진행중, 승인은 완료', () => {
        expect(classifyTodo(todo({ approvalStatusType: 'in_progress', status: 'IN_PROGRESS', writtenInCycle: true }))).toBe('done');
        expect(classifyTodo(todo({ approvalStatusType: 'approved', status: 'ACTIVE', writtenInCycle: true }))).toBe('done');
    });

    it('수시와 사용안함 업무는 보드에서 제외', () => {
        expect(classifyTodo(todo({ cycle: 'ANYTIME' }))).toBe('skip');
        expect(classifyTodo(todo({ active: false }))).toBe('skip');
    });

    it('만료일 관리 업무는 주기 카드로 만들지 않는다', () => {
        expect(classifyTodo(todo({ cycle: 'MONTH', expirationApply: true }))).toBe('skip');
    });
});

describe('buildBoard', () => {
    it('마감일 → 분류 정렬순서 → 업무명 순으로 정렬하고 완료 수를 센다', () => {
        const board = buildBoard(
            [
                todo({ id: 'month', cycle: 'MONTH', divisionName: '방충방서' }),
                todo({ id: 'day-b', divisionName: '위생점검', categorySortOrder: 2 }),
                todo({ id: 'day-a', divisionName: 'CCP 온도', categorySortOrder: 1 }),
                todo({ id: 'rej', approvalStatusType: 'rejected', writtenInCycle: true }),
                todo({ id: 'ok', approvalStatusType: 'approved', status: 'ACTIVE', writtenInCycle: true }),
                todo({ id: 'any', cycle: 'ANYTIME' }),
            ],
            WED,
        );

        expect(board.write.map((item) => item.id)).toEqual(['day-a', 'day-b', 'month']);
        expect(board.write[2].dueDate).toBe('2026-10-31');
        expect(board.rejected.map((item) => item.id)).toEqual(['rej']);
        expect(board.doneCount).toBe(1);
    });
});

describe('buildHistoryByWork', () => {
    const event = (
        workId: string,
        cycleDate: string,
        approvalStatusType: string,
        isFuture = false,
    ): CalendarWorkEvent => ({
        date: cycleDate,
        cycleDate,
        isFuture,
        item: todo({ id: workId, approvalStatusType }),
    });

    it('업무별로 cycleDate 오름차순, 최근 7개만 남긴다', () => {
        const events = Array.from({ length: 9 }, (_, index) =>
            event('w1', `2026-10-${String(20 + index).padStart(2, '0')}`, 'approved'),
        ).reverse();

        const cells = buildHistoryByWork(events).get('w1') ?? [];

        expect(cells).toHaveLength(7);
        expect(cells[0].cycleDate).toBe('2026-10-22');
        expect(cells[6].cycleDate).toBe('2026-10-28');
    });

    it('상태 라벨은 캘린더와 같은 규칙, 미래 주기와 만료일 이벤트는 뺀다', () => {
        const events = [
            event('w1', '2026-10-26', 'rejected'),
            event('w1', '2026-10-27', ''),
            event('w1', '2026-10-28', 'in_progress'),
            event('w1', '2026-10-29', '', true),
            { ...event('w1', '2026-10-30', 'approved'), expiration: {} as CalendarWorkEvent['expiration'] },
        ];

        expect(buildHistoryByWork(events).get('w1')).toEqual([
            { cycleDate: '2026-10-26', label: '반려' },
            { cycleDate: '2026-10-27', label: '미작성' },
            { cycleDate: '2026-10-28', label: '결재진행중' },
        ]);
    });
});