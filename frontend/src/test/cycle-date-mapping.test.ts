import { describe, expect, it } from 'vitest';
import { mapTodosToCalendarEvents } from '../pages/documents/work-calendar/cycleDateMapping';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';

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

describe('mapTodosToCalendarEvents', () => {
    it('places a daily-cycle item on every day of a 28-day month', () => {
        const item = buildItem({ cycle: '일일' });

        const events = mapTodosToCalendarEvents([item], 2026, 1); // 2026-02

        expect(events).toHaveLength(28);
        expect(events[0].date).toBe('2026-02-01');
        expect(events[27].date).toBe('2026-02-28');
    });

    it('places a weekly-cycle item on every Monday of the month', () => {
        const item = buildItem({ cycle: '주간' });

        const events = mapTodosToCalendarEvents([item], 2026, 1); // 2026-02

        expect(events.map((event) => event.date)).toEqual([
            '2026-02-02',
            '2026-02-09',
            '2026-02-16',
            '2026-02-23',
        ]);
    });

    it('places a monthly-cycle item on the 1st of the month', () => {
        const item = buildItem({ cycle: '월간' });

        const events = mapTodosToCalendarEvents([item], 2026, 1);

        expect(events).toEqual([{ date: '2026-02-01', item }]);
    });

    it('places a yearly-cycle item on January 1st only when viewing January', () => {
        const item = buildItem({ cycle: '매년' });

        const januaryEvents = mapTodosToCalendarEvents([item], 2026, 0);
        const februaryEvents = mapTodosToCalendarEvents([item], 2026, 1);

        expect(januaryEvents).toEqual([{ date: '2026-01-01', item }]);
        expect(februaryEvents).toEqual([]);
    });

    it('does not place event-based ("발생시") items on the calendar', () => {
        const item = buildItem({ cycle: '발생시' });

        const events = mapTodosToCalendarEvents([item], 2026, 1);

        expect(events).toEqual([]);
    });
});