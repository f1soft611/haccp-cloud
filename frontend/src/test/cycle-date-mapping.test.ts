import { describe, expect, it } from 'vitest';
import { mapTodosToCalendarEvents } from '../pages/documents/work-calendar/cycleDateMapping';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance } from '../services/documents/haccpBaseWorkService';

// 2026-10-08 목요일 (이번 주 월요일 10-05, 이번 달 1일 10-01)
const TODAY = new Date(2026, 9, 8);
// 2026-10-12 월요일 (이번 주 월요일 10-12, 이번 달 1일 10-01)
const TODAY_1012 = new Date(2026, 9, 12);

// 기존 -> (year, monthIndex0)로 보는 달 지정
// 변경 -> 달력에 보이는 범위(일요일 ~ 토요일)로 지정
const JAN_2026 = ['2025-12-28', '2026-01-31'] as const;
const FEB_2026 = ['2026-02-01', '2026-02-28'] as const;
const SEP_2026 = ['2026-08-30', '2026-10-03'] as const;
const OCT_2026 = ['2026-09-27', '2026-10-31'] as const;
const NOV_2026 = ['2026-11-01', '2026-12-05'] as const;
const DEC_2026 = ['2026-11-29', '2027-01-02'] as const;

function buildItem(
    overrides: Partial<TenantTodoCardItem> = {},
): TenantTodoCardItem {
    return {
        id: '1',
        tenantCode: 'TENANT-A',
        categoryGroupId: '10',
        categoryCode: 'HA',
        categoryName: 'HACCP (HA)',
        categorySortOrder: 1,
        divisionCode: '001',
        divisionName: '점검 문서',
        cycle: 'MONTH',
        cycleName: '월',
        active: true,
        assigneeIds: [],
        referenceIds: [],
        assigneeMapped: true,
        hasDocument: true,
        title: '점검 문서',
        category: 'HACCP (HA)',
        status: 'DRAFT',
        updatedBy: '관리자',
        updatedAt: '',
        writtenInCycle: false,
        routeIdType: 'work',
        routeId: '1',
        ...overrides,
    };
}

function instance(
    cycleDate: string,
    statusType: string,
    approvalId = '900',
    registeredDate = '',
): HaccpWorkCycleInstance {
    return { workId: '1', cycleDate, approvalId, statusType, registeredDate, title: '' };
}

describe('mapTodosToCalendarEvents', () => {
    it('places a daily item on every day of a past month', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'DAY' })], ...FEB_2026, [], TODAY,
        );

        expect(events).toHaveLength(28);
        expect(events[0].date).toBe('2026-02-01');
        expect(events[27].date).toBe('2026-02-28');
        expect(events.every((event) => event.date === event.cycleDate)).toBe(true);
        expect(events.every((event) => !event.isFuture)).toBe(true);
    });

    it('attaches status per daily instance and leaves other days unwritten', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'DAY' })], ...OCT_2026,
            [instance('2026-10-02', 'pre_apply')], TODAY,
        );
        const byDate = new Map(events.map((event) => [event.date, event]));

        expect(byDate.get('2026-10-02')?.item).toMatchObject({
            approvalId: '900',
            approvalStatusType: 'pre_apply',
            writtenInCycle: true,
            routeIdType: 'approval',
            routeId: '900',
        });
        expect(byDate.get('2026-10-03')?.item).toMatchObject({
            approvalId: '',
            approvalStatusType: '',
            writtenInCycle: false,
            routeIdType: 'work',
            routeId: '1',
        });
    });

    it('marks daily events after today as future', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'DAY' })], ...OCT_2026, [], TODAY,
        );
        const byDate = new Map(events.map((event) => [event.date, event]));

        expect(byDate.get('2026-10-08')?.isFuture).toBe(false);
        expect(byDate.get('2026-10-09')?.isFuture).toBe(true);
    });

    it('places weekly items on Mondays of a past month', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'WEEK' })], ...FEB_2026, [], TODAY,
        );

        expect(events.map((event) => event.date)).toEqual([
            '2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23',
        ]);
    });

    // 기존 -> 보는 달의 월요일만 / 변경 -> 범위 밖 월요일(09-28)도 포함
    it('places the current week on today and other weeks on Mondays', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'WEEK' })], ...OCT_2026, [], TODAY,
        );

        expect(
            events.map(({ date, cycleDate, isFuture }) => ({ date, cycleDate, isFuture })),
        ).toEqual([
            { date: '2026-09-28', cycleDate: '2026-09-28', isFuture: false },
            { date: '2026-10-08', cycleDate: '2026-10-05', isFuture: false },
            { date: '2026-10-12', cycleDate: '2026-10-12', isFuture: true },
            { date: '2026-10-19', cycleDate: '2026-10-19', isFuture: true },
            { date: '2026-10-26', cycleDate: '2026-10-26', isFuture: true },
        ]);
    });

    // 기존 -> 9월 화면에는 10-01 칸 없음 / 변경 -> 9월·10월 화면 모두 10-01 칸에 같은 이벤트
    it('shows the current week on today in both months when its Monday is in the previous month', () => {
        const octFirst = new Date(2026, 9, 1); // 목요일, 이번 주 월요일 = 09-28
        const october = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'WEEK' })], ...OCT_2026, [], octFirst,
        );
        const september = mapTodosToCalendarEvents(
            [buildItem({ cycle: 'WEEK' })], ...SEP_2026, [], octFirst,
        );

        expect(october[0]).toMatchObject({ date: '2026-10-01', cycleDate: '2026-09-28' });
        expect(september.map((event) => event.date)).toEqual([
            '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-10-01',
        ]);
        expect(september[4]).toMatchObject({ date: '2026-10-01', cycleDate: '2026-09-28' });
    });

    // 기존 -> 11월 화면은 11-01만 / 변경 -> 범위 밖 12-01도 포함
    it('places the current month on today, other months on the 1st', () => {
        const item = buildItem({ cycle: 'MONTH' });

        expect(mapTodosToCalendarEvents([item], ...OCT_2026, [], TODAY)).toMatchObject([
            { date: '2026-10-08', cycleDate: '2026-10-01', isFuture: false },
        ]);
        expect(mapTodosToCalendarEvents([item], ...FEB_2026, [], TODAY)).toMatchObject([
            { date: '2026-02-01', cycleDate: '2026-02-01', isFuture: false },
        ]);
        expect(mapTodosToCalendarEvents([item], ...NOV_2026, [], TODAY)).toMatchObject([
            { date: '2026-11-01', cycleDate: '2026-11-01', isFuture: true },
            { date: '2026-12-01', cycleDate: '2026-12-01', isFuture: true },
        ]);
    });

    it('places the current year on today, not on January 1st', () => {
        const item = buildItem({ cycle: 'YEAR' });

        expect(mapTodosToCalendarEvents([item], ...OCT_2026, [], TODAY)).toMatchObject([
            { date: '2026-10-08', cycleDate: '2026-01-01', isFuture: false },
        ]);
        expect(mapTodosToCalendarEvents([item], ...JAN_2026, [], TODAY)).toEqual([]);
        expect(mapTodosToCalendarEvents([item], ...FEB_2026, [], TODAY)).toEqual([]);
    });

    // 기존 -> '발생시' 미표시 / 변경 -> 고정 기준일 규칙이 없는 ANYTIME/QUARTER/HALF 미표시
    it.each(['ANYTIME', 'QUARTER', 'HALF'])('does not place %s items on the calendar', (cycle) => {
        expect(
            mapTodosToCalendarEvents([buildItem({ cycle })], ...FEB_2026, [], TODAY),
        ).toEqual([]);
    });

    describe('off-range days', () => {
        it('places a daily item on every visible day including other months', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'DAY' })], ...SEP_2026, [], TODAY_1012,
            );
            const dates = events.map((event) => event.date);

            expect(events).toHaveLength(35);
            expect(dates.slice(0, 2)).toEqual(['2026-08-30', '2026-08-31']);
            expect(dates.slice(-3)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
            expect(events.every((event) => !event.isFuture)).toBe(true);
        });

        it('places weekly items on visible Mondays of other months', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...SEP_2026, [], TODAY_1012,
            );

            expect(events.map((event) => event.date)).toEqual([
                '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28',
            ]);
        });

        it('skips the current month when today is not visible', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], ...SEP_2026, [], TODAY_1012,
            );

            expect(events).toMatchObject([
                { date: '2026-09-01', cycleDate: '2026-09-01', isFuture: false },
            ]);
        });

        it('places a yearly item on next January 1st when it is visible', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'YEAR' })], ...DEC_2026, [], TODAY_1012,
            );

            expect(events).toMatchObject([
                { date: '2027-01-01', cycleDate: '2027-01-01', isFuture: true },
            ]);
        });

        it('shows the current week on today when its Monday is before the visible range', () => {
            const novFirst = new Date(2026, 10, 1); // 일요일, 이번 주 월요일 = 10-26
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...NOV_2026, [], novFirst,
            );

            expect(events.map(({ date, cycleDate }) => ({ date, cycleDate }))).toEqual([
                { date: '2026-11-02', cycleDate: '2026-11-02' },
                { date: '2026-11-09', cycleDate: '2026-11-09' },
                { date: '2026-11-16', cycleDate: '2026-11-16' },
                { date: '2026-11-23', cycleDate: '2026-11-23' },
                { date: '2026-11-30', cycleDate: '2026-11-30' },
                { date: '2026-11-01', cycleDate: '2026-10-26' },
            ]);
        });

        it('shows the current month on today when its 1st is before the visible range', () => {
            const sep29 = new Date(2026, 8, 29); // 화요일, 이번 달 1일 = 09-01
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], ...OCT_2026, [], sep29,
            );

            expect(
                events.map(({ date, cycleDate, isFuture }) => ({ date, cycleDate, isFuture })),
            ).toEqual([
                { date: '2026-10-01', cycleDate: '2026-10-01', isFuture: true },
                { date: '2026-09-29', cycleDate: '2026-09-01', isFuture: false },
            ]);
        });
    });

    describe('registered date', () => {
        const dates = (events: ReturnType<typeof mapTodosToCalendarEvents>) =>
            events.map(({ date, cycleDate }) => ({ date, cycleDate }));

        it('pins the current week on its registered date once registered', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-10-05', 'in_progress', '900', '2026-10-06')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-10-06', cycleDate: '2026-10-05' });
            expect(events.some((event) => event.date === '2026-10-08')).toBe(false);
        });

        it('keeps a temp-saved current week on today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-10-05', 'pre_apply', '900', '2026-10-07')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-10-08', cycleDate: '2026-10-05' });
            expect(events.some((event) => event.date === '2026-10-07')).toBe(false);
        });

        it('pins a temp-saved past week on its registered date, not today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-09-28', 'pre_apply', '900', '2026-09-30')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-09-30', cycleDate: '2026-09-28' });
            expect(events.filter((event) => event.date === '2026-10-08')).toHaveLength(1);
        });

        it('keeps a rejected current week on today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-10-05', 'rejected', '900', '2026-10-06')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-10-08', cycleDate: '2026-10-05' });
            expect(events.some((event) => event.date === '2026-10-06')).toBe(false);
        });

        it('pins a rejected past week on its registered date, not today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-09-28', 'rejected', '900', '2026-09-30')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-09-30', cycleDate: '2026-09-28' });
            expect(dates(events)).toContainEqual({ date: '2026-10-08', cycleDate: '2026-10-05' });
            expect(events.filter((event) => event.date === '2026-10-08')).toHaveLength(1);
        });

        it('pins the current month and year on their registered dates', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ id: '1', cycle: 'MONTH' })], ...OCT_2026,
                [instance('2026-10-01', 'approved', '900', '2026-10-03')], TODAY,
            );
            expect(dates(events)).toEqual([{ date: '2026-10-03', cycleDate: '2026-10-01' }]);

            const yearly = mapTodosToCalendarEvents(
                [buildItem({ id: '1', cycle: 'YEAR' })], ...OCT_2026,
                [instance('2026-01-01', 'approved', '900', '2026-10-02')], TODAY,
            );
            expect(dates(yearly)).toEqual([{ date: '2026-10-02', cycleDate: '2026-01-01' }]);
        });
    });
    it('uses each day own document title, falling back to the work name', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ id: '1', cycle: 'DAY', title: '대기문서 제목', divisionName: '일일점검' })],
            ...OCT_2026,
            [{ ...instance('2026-10-01', 'in_progress'), title: '10/1 일일점검' }],
            TODAY,
        );
        expect(events.find((e) => e.date === '2026-10-01')?.item.title).toBe('10/1 일일점검');
        expect(events.find((e) => e.date === '2026-10-02')?.item.title).toBe('일일점검');
    });
});