import { describe, expect, it } from 'vitest';
import { mapTodosToCalendarEvents } from '../pages/documents/work-calendar/cycleDateMapping';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpWorkCycleInstance } from '../services/documents/haccpBaseWorkService';

// 2026-10-08 목요일 (이번 주 월요일 10-05, 이번 달 1일 10-01)
const TODAY = new Date(2026, 9, 8);

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
        cycle: '월',
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
): HaccpWorkCycleInstance {
    return { workId: '1', cycleDate, approvalId, statusType };
}

describe('mapTodosToCalendarEvents', () => {
    it('places a daily item on every day of a past month', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: '일' })], 2026, 1, [], TODAY,
        );

        expect(events).toHaveLength(28);
        expect(events[0].date).toBe('2026-02-01');
        expect(events[27].date).toBe('2026-02-28');
        expect(events.every((event) => event.date === event.cycleDate)).toBe(true);
        expect(events.every((event) => !event.isFuture)).toBe(true);
    });

    it('attaches status per daily instance and leaves other days unwritten', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: '일' })], 2026, 9,
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
            [buildItem({ cycle: '일' })], 2026, 9, [], TODAY,
        );
        const byDate = new Map(events.map((event) => [event.date, event]));

        expect(byDate.get('2026-10-08')?.isFuture).toBe(false);
        expect(byDate.get('2026-10-09')?.isFuture).toBe(true);
    });

    it('places weekly items on Mondays of a past month', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: '주' })], 2026, 1, [], TODAY,
        );

        expect(events.map((event) => event.date)).toEqual([
            '2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23',
        ]);
    });

    it('places the current week on today and later weeks on Mondays as future', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle: '주' })], 2026, 9, [], TODAY,
        );

        expect(
            events.map(({ date, cycleDate, isFuture }) => ({ date, cycleDate, isFuture })),
        ).toEqual([
            { date: '2026-10-08', cycleDate: '2026-10-05', isFuture: false },
            { date: '2026-10-12', cycleDate: '2026-10-12', isFuture: true },
            { date: '2026-10-19', cycleDate: '2026-10-19', isFuture: true },
            { date: '2026-10-26', cycleDate: '2026-10-26', isFuture: true },
        ]);
    });

    it('shows the current week on today even when its Monday is in the previous month', () => {
        const octFirst = new Date(2026, 9, 1); // 목요일, 이번 주 월요일 = 09-28
        const october = mapTodosToCalendarEvents(
            [buildItem({ cycle: '주' })], 2026, 9, [], octFirst,
        );
        const september = mapTodosToCalendarEvents(
            [buildItem({ cycle: '주' })], 2026, 8, [], octFirst,
        );

        expect(october[0]).toMatchObject({ date: '2026-10-01', cycleDate: '2026-09-28' });
        expect(september.map((event) => event.date)).toEqual([
            '2026-09-07', '2026-09-14', '2026-09-21',
        ]);
    });

    it('places the current month on today, other months on the 1st', () => {
        const item = buildItem({ cycle: '월' });

        expect(mapTodosToCalendarEvents([item], 2026, 9, [], TODAY)).toMatchObject([
            { date: '2026-10-08', cycleDate: '2026-10-01', isFuture: false },
        ]);
        expect(mapTodosToCalendarEvents([item], 2026, 1, [], TODAY)).toMatchObject([
            { date: '2026-02-01', cycleDate: '2026-02-01', isFuture: false },
        ]);
        expect(mapTodosToCalendarEvents([item], 2026, 10, [], TODAY)).toMatchObject([
            { date: '2026-11-01', cycleDate: '2026-11-01', isFuture: true },
        ]);
    });

    it('places a yearly item on January 1st only when viewing January', () => {
        const item = buildItem({ cycle: '매년' });

        expect(mapTodosToCalendarEvents([item], 2026, 0, [], TODAY)).toMatchObject([
            { date: '2026-01-01', cycleDate: '2026-01-01' },
        ]);
        expect(mapTodosToCalendarEvents([item], 2026, 1, [], TODAY)).toEqual([]);
    });

    it('does not place event-based ("발생시") items on the calendar', () => {
        expect(
            mapTodosToCalendarEvents([buildItem({ cycle: '발생시' })], 2026, 1, [], TODAY),
        ).toEqual([]);
    });
});