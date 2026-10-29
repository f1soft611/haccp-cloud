import { describe, expect, it } from 'vitest';
import {
    mapExpirationsToCalendarEvents,
    mapTodosToCalendarEvents,
} from '../pages/documents/work-calendar/cycleDateMapping';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import type {
    HaccpWorkCycleInstance,
    HaccpWorkExpiration,
} from '../services/documents/haccpBaseWorkService';

// 2026-10-08 목요일 (이번 주 월요일 10-05, 이번 달 1일 10-01)
const TODAY = new Date(2026, 9, 8);
// 2026-10-12 월요일 (이번 주 월요일 10-12, 이번 달 1일 10-01)
const TODAY_1012 = new Date(2026, 9, 12);

const JAN_2026 = ['2025-12-28', '2026-01-31'] as const;
const FEB_2026 = ['2026-02-01', '2026-02-28'] as const;
const SEP_2026 = ['2026-08-30', '2026-10-03'] as const;
const OCT_2026 = ['2026-09-27', '2026-10-31'] as const;
const NOV_2026 = ['2026-11-01', '2026-12-05'] as const;
const DEC_2026 = ['2026-11-29', '2027-01-02'] as const;
const APR_2026 = ['2026-03-29', '2026-05-02'] as const;
const JUL_2026 = ['2026-06-28', '2026-08-01'] as const;
const MAY_2026 = ['2026-04-26', '2026-06-06'] as const;

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
        expirationApply: false,
        approvalApply: true,
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
    overrides: Partial<HaccpWorkCycleInstance> = {},
): HaccpWorkCycleInstance {
    return {
        workId: '1', cycleDate, approvalId, statusType, registeredDate, title: '',
        targetName: '', materialType: '',
        ...overrides,
    };
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

    // 기존 -> QUARTER/HALF 미표시 / 변경 -> 달력 기준 분기(1, 4, 7, 10월 1일), 반기(1, 7월 1일)로 표시
    describe('quarter and half items', () => {
        it('places the current quarter on today and past quarters on their 1st', () => {
            const item = buildItem({ cycle: 'QUARTER' });

            expect(mapTodosToCalendarEvents([item], ...OCT_2026, [], TODAY)).toMatchObject([
                { date: '2026-10-08', cycleDate: '2026-10-01', isFuture: false },
            ]);
            expect(mapTodosToCalendarEvents([item], ...APR_2026, [], TODAY)).toMatchObject([
                { date: '2026-04-01', cycleDate: '2026-04-01', isFuture: false },
            ]);
            expect(mapTodosToCalendarEvents([item], ...JUL_2026, [], TODAY)).toMatchObject([
                { date: '2026-07-01', cycleDate: '2026-07-01', isFuture: false },
            ]);
            expect(mapTodosToCalendarEvents([item], ...FEB_2026, [], TODAY)).toEqual([]);
            expect(mapTodosToCalendarEvents([item], ...DEC_2026, [], TODAY)).toMatchObject([
                { date: '2027-01-01', cycleDate: '2027-01-01', isFuture: true },
            ]);
        });

        it('places the current half on today and past halves on their 1st', () => {
            const item = buildItem({ cycle: 'HALF' });

            expect(mapTodosToCalendarEvents([item], ...OCT_2026, [], TODAY)).toMatchObject([
                { date: '2026-10-08', cycleDate: '2026-07-01', isFuture: false },
            ]);
            expect(mapTodosToCalendarEvents([item], ...JAN_2026, [], TODAY)).toMatchObject([
                { date: '2026-01-01', cycleDate: '2026-01-01', isFuture: false },
            ]);
            // 진행 중 반기(07-01) 미작성은 오늘 칸이라 7월 화면에는 없다
            expect(mapTodosToCalendarEvents([item], ...JUL_2026, [], TODAY)).toEqual([]);
            expect(mapTodosToCalendarEvents([item], ...APR_2026, [], TODAY)).toEqual([]);
        });

        it('pins a submitted current half on its cycle start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'HALF' })], ...JUL_2026,
                [instance('2026-07-01', 'approved', '900', '2026-10-02')], TODAY,
            );

            expect(events).toMatchObject([
                { date: '2026-07-01', cycleDate: '2026-07-01', item: { approvalId: '900', writtenInCycle: true } },
            ]);
        });

        it('shows quarters and halves from the cycle containing the display start date', () => {
            const quarter = buildItem({ cycle: 'QUARTER' });
            const half = buildItem({ cycle: 'HALF' });

            expect(mapTodosToCalendarEvents([quarter], ...APR_2026, [], TODAY, '2026-05-10'))
            .toMatchObject([{ cycleDate: '2026-04-01' }]);
            expect(mapTodosToCalendarEvents([quarter], ...APR_2026, [], TODAY, '2026-07-02')).toEqual([]);
            expect(mapTodosToCalendarEvents([half], ...JAN_2026, [], TODAY, '2026-03-01'))
            .toMatchObject([{ cycleDate: '2026-01-01' }]);
            expect(mapTodosToCalendarEvents([half], ...JAN_2026, [], TODAY, '2026-07-02')).toEqual([]);
        });

        it('draws a half document on its report date and links it to the cycle', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'HALF' })], ...OCT_2026,
                [instance('2026-10-05', 'approved')], TODAY,
            );

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                date: '2026-10-05',
                cycleDate: '2026-07-01',
                item: { approvalId: '900', writtenInCycle: true },
            });
        });

        it('draws a past half document on its report date even when the cycle start is before the range', () => {
            const item = buildItem({ cycle: 'HALF' });
            const docs = [instance('2026-05-10', 'approved')];

            expect(mapTodosToCalendarEvents([item], ...MAY_2026, docs, TODAY)).toMatchObject([
                { date: '2026-05-10', cycleDate: '2026-01-01', item: { writtenInCycle: true } },
            ]);
            // 문서가 표시일로 옮겨 가므로 1월 화면의 01-01 칸에는 남지 않는다
            expect(mapTodosToCalendarEvents([item], ...JAN_2026, docs, TODAY)).toEqual([]);
        });

        it('keeps a draft of the current half on today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'HALF' })], ...OCT_2026,
                [instance('2026-10-05', 'pre_apply')], TODAY,
            );

            expect(events).toMatchObject([
                { date: '2026-10-08', cycleDate: '2026-07-01', item: { approvalId: '900' } },
            ]);
        });
    });

    // 수시: 고정 기준일이 없으므로 작성한 문서만 작성일(report_date) 칸에 표시
    describe('anytime items', () => {
        const anytime = () => buildItem({ cycle: 'ANYTIME' });

        it('places each written document on its report date', () => {
            const events = mapTodosToCalendarEvents(
                [anytime()], ...OCT_2026,
                [instance('2026-10-02', 'approved', '901'), instance('2026-10-06', 'in_progress', '902')],
                TODAY,
            );

            expect(events.map((event) => [event.date, event.cycleDate, event.item.approvalId])).toEqual([
                ['2026-10-02', '2026-10-02', '901'],
                ['2026-10-06', '2026-10-06', '902'],
            ]);
            expect(events.every((event) => event.item.writtenInCycle && !event.isFuture)).toBe(true);
        });

        it('places nothing when there is no document', () => {
            expect(mapTodosToCalendarEvents([anytime()], ...OCT_2026, [], TODAY)).toEqual([]);
        });

        it('keeps rejected and temp-saved documents on their report date, not today', () => {
            const events = mapTodosToCalendarEvents(
                [anytime()], ...OCT_2026,
                [instance('2026-10-02', 'rejected', '901'), instance('2026-10-05', 'pre_apply', '902')],
                TODAY,
            );

            expect(events.map((event) => event.date)).toEqual(['2026-10-02', '2026-10-05']);
        });

        // 기존 -> 표시 시작일 이전 문서도 숨김 / 변경 -> 보이는 범위 밖 문서만 숨김 (작성 문서는 입사일 이전이어도 표시)
        it('skips documents outside the visible range', () => {
            const events = mapTodosToCalendarEvents(
                [anytime()], ...OCT_2026,
                [
                    instance('2026-09-20', 'approved', '901'),
                    instance('2026-10-02', 'approved', '902'),
                    instance('2026-10-07', 'approved', '903'),
                ],
                TODAY, '2026-10-05',
            );

            expect(events.map((event) => event.item.approvalId)).toEqual(['902', '903']);
        });

        it('ignores documents of other works', () => {
            const events = mapTodosToCalendarEvents(
                [anytime()], ...OCT_2026,
                [{ ...instance('2026-10-02', 'approved', '901'), workId: '2' }],
                TODAY,
            );

            expect(events).toEqual([]);
        });
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

        // 변경 -> 진행 중 주 상신 문서는 주기 시작일(월요일 10-05) 칸
        it('pins a submitted current week on its cycle start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-10-05', 'in_progress', '900', '2026-10-06')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-10-05', cycleDate: '2026-10-05' });
            expect(events.some((event) => event.date === '2026-10-06')).toBe(false);
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

        it('pins a temp-saved past week on its cycle start date, not today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-09-28', 'pre_apply', '900', '2026-09-30')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-09-28', cycleDate: '2026-09-28' });
            expect(events.some((event) => event.date === '2026-09-30')).toBe(false);
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

        it('pins a rejected past week on its cycle start date, not today', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-09-28', 'rejected', '900', '2026-09-30')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-09-28', cycleDate: '2026-09-28' });
            expect(dates(events)).toContainEqual({ date: '2026-10-08', cycleDate: '2026-10-05' });
            expect(events.some((event) => event.date === '2026-09-30')).toBe(false);
            expect(events.filter((event) => event.date === '2026-10-08')).toHaveLength(1);
        });

        it('pins a submitted current month and year on their cycle start dates', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ id: '1', cycle: 'MONTH' })], ...OCT_2026,
                [instance('2026-10-01', 'approved', '900', '2026-10-03')], TODAY,
            );
            expect(dates(events)).toEqual([{ date: '2026-10-01', cycleDate: '2026-10-01' }]);

            // 1월 1일이 보이는 1월 화면에서 확인 (10월 화면에는 1월 1일 칸이 없어 표시되지 않음)
            const yearly = mapTodosToCalendarEvents(
                [buildItem({ id: '1', cycle: 'YEAR' })], ...JAN_2026,
                [instance('2026-01-01', 'approved', '900', '2026-10-02')], TODAY,
            );
            expect(dates(yearly)).toEqual([{ date: '2026-01-01', cycleDate: '2026-01-01' }]);

            const yearlyInOctober = mapTodosToCalendarEvents(
                [buildItem({ id: '1', cycle: 'YEAR' })], ...OCT_2026,
                [instance('2026-01-01', 'approved', '900', '2026-10-02')], TODAY,
            );
            expect(yearlyInOctober).toEqual([]);
        });

        it('pins a past week registered this week on its cycle start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026,
                [instance('2026-09-28', 'approved', '900', '2026-10-06')], TODAY,
            );

            expect(dates(events)).toContainEqual({ date: '2026-09-28', cycleDate: '2026-09-28' });
            expect(events.some((event) => event.date === '2026-10-06')).toBe(false);
        });

        it('pins a past month registered this month on its 1st', () => {
            // 2026-11-10 화요일 기준, 10월 문서를 11-03에 임시저장
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], '2026-09-27', '2026-11-14',
                [instance('2026-10-01', 'pre_apply', '900', '2026-11-03')], new Date(2026, 10, 10),
            );

            expect(dates(events)).toContainEqual({ date: '2026-10-01', cycleDate: '2026-10-01' });
            expect(events.some((event) => event.date === '2026-11-03')).toBe(false);
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
    
    // 표시 시작일(입사일·테넌트 생성일 중 늦은 날)이 속한 주기부터 표시
    describe('display start date', () => {
        it('shows daily items from the display start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'DAY' })], ...OCT_2026, [], TODAY, '2026-10-07',
            );

            expect(events).toHaveLength(25);
            expect(events[0].date).toBe('2026-10-07');
        });

        it('shows weekly items from the week containing the display start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'WEEK' })], ...OCT_2026, [], TODAY, '2026-10-07',
            );

            expect(events.map((event) => event.cycleDate).sort()).toEqual([
                '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26',
            ]);
        });

        it('shows monthly items from the month containing the display start date', () => {
            const inSeptember = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], ...SEP_2026, [], TODAY, '2026-09-15',
            );
            const inOctober = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], ...SEP_2026, [], TODAY, '2026-10-02',
            );

            expect(inSeptember.map((event) => event.cycleDate)).toEqual(['2026-09-01']);
            expect(inOctober).toEqual([]);
        });

        it('shows yearly items from the year containing the display start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'YEAR' })], ...OCT_2026, [], TODAY, '2026-05-01',
            );

            expect(events.map((event) => event.cycleDate)).toEqual(['2026-01-01']);
        });

        it('shows written documents of cycles before the display start date', () => {
            const events = mapTodosToCalendarEvents(
                [buildItem({ cycle: 'MONTH' })], ...SEP_2026,
                [instance('2026-09-03', 'approved', '901')], TODAY, '2026-10-02',
            );

            expect(events.map((event) => [event.date, event.item.approvalId])).toEqual([
                ['2026-09-03', '901'],
            ]);
        });

        it('does not filter when the display start date is empty', () => {
            const items = [buildItem({ cycle: 'DAY' }), buildItem({ id: '2', cycle: 'WEEK' })];

            expect(mapTodosToCalendarEvents(items, ...OCT_2026, [], TODAY, '')).toEqual(
                mapTodosToCalendarEvents(items, ...OCT_2026, [], TODAY),
            );
        });
    });

    // 사용안함 업무: 앞으로 작성할 주기 칸 없이 작성 문서만 문서 표시일 칸에
    describe('inactive items', () => {
        it.each(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME'])(
            'places only written documents for inactive %s items',
            (cycle) => {
                const events = mapTodosToCalendarEvents(
                    [buildItem({ cycle, active: false })], ...OCT_2026,
                    [instance('2026-10-02', 'approved', '901'), instance('2026-10-06', 'rejected', '902')],
                    TODAY,
                );

                expect(events.map((event) => [event.date, event.item.approvalId])).toEqual([
                    ['2026-10-02', '901'],
                    ['2026-10-06', '902'],
                ]);
                expect(events.every((event) => event.item.writtenInCycle && !event.isFuture)).toBe(true);
            },
        );

        it('places nothing for an inactive item without documents', () => {
            expect(
                mapTodosToCalendarEvents([buildItem({ cycle: 'DAY', active: false })], ...OCT_2026, [], TODAY),
            ).toEqual([]);
        });

        it('skips documents outside the visible range', () => {
            expect(
                mapTodosToCalendarEvents(
                    [buildItem({ cycle: 'MONTH', active: false })], ...OCT_2026,
                    [instance('2026-09-20', 'approved', '901')],
                    TODAY,
                ),
            ).toEqual([]);
        });
    });
});

describe('expiration work (expirationApply)', () => {
    const CYCLES = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME'];

    it.each(CYCLES)('creates no events for a %s item without documents', (cycle) => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle, expirationApply: true })],
            ...OCT_2026,
            [],
            TODAY,
        );

        expect(events).toEqual([]);
    });

    it.each(CYCLES)('shows each written document of a %s item on its report_date', (cycle) => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ cycle, expirationApply: true, divisionName: '검교정' })],
            ...OCT_2026,
            [
                instance('2026-10-05', 'approved', '901', '', { targetName: '저울 A' }),
                instance('2026-10-05', 'in_progress', '902', '', { targetName: '온도계 B' }),
            ],
            TODAY,
        );

        expect(events.map((event) => [event.date, event.item.title, event.item.approvalId])).toEqual([
            ['2026-10-05', '검교정 - 저울 A', '901'],
            ['2026-10-05', '검교정 - 온도계 B', '902'],
        ]);
        expect(events.every((event) => event.cycleDate === '2026-10-05' && !event.isFuture)).toBe(true);
        expect(events[1].item).toMatchObject({
            approvalStatusType: 'in_progress',
            routeIdType: 'approval',
            routeId: '902',
        });
    });

    it('uses the material type name when a document has no target name', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ expirationApply: true, divisionName: '유통기한' })],
            ...OCT_2026,
            [
                instance('2026-10-07', 'approved', '903', '', { materialType: 'RAW' }),
                instance('2026-10-08', 'approved', '904'),
            ],
            TODAY,
            '',
            (code) => (code === 'RAW' ? '원재료' : code),
        );

        expect(events.map((event) => event.item.title)).toEqual(['유통기한 - 원재료', '유통기한']);
    });

    it('skips expiration work documents outside the visible range', () => {
        const events = mapTodosToCalendarEvents(
            [buildItem({ expirationApply: true })],
            ...OCT_2026,
            [instance('2026-09-20', 'approved', '905', '', { targetName: '저울 A' })],
            TODAY,
        );

        expect(events).toEqual([]);
    });

    it('does not let an expiration work document replace a normal item document', () => {
        const events = mapTodosToCalendarEvents(
            [
                buildItem({ id: '1', cycle: 'MONTH', expirationApply: false }),
                buildItem({ id: '2', cycle: 'MONTH', expirationApply: true, divisionName: '검교정' }),
            ],
            ...OCT_2026,
            [
                instance('2026-10-01', 'approved', '910'),
                instance('2026-10-01', 'approved', '911', '', { workId: '2', targetName: '저울 A' }),
            ],
            TODAY,
        );
        const normal = events.find((event) => event.item.id === '1' && event.cycleDate === '2026-10-01');
        const expiration = events.filter((event) => event.item.id === '2');

        expect(normal?.item.approvalId).toBe('910');
        expect(expiration.map((event) => event.item.approvalId)).toEqual(['911']);
    });

    it('keeps cycle events for a normal item next to an expiration item', () => {
        const events = mapTodosToCalendarEvents(
            [
                buildItem({ id: '1', cycle: 'MONTH', expirationApply: false }),
                buildItem({ id: '2', cycle: 'MONTH', expirationApply: true }),
            ],
            ...OCT_2026,
            [],
            TODAY,
        );

        expect(events.map((event) => event.item.id)).toEqual(['1']);
    });

    it('shows one expiration event per equipment for the same work', () => {
        const expiration = (
            equipmentId: string,
            targetName: string,
            approvalId: string,
        ): HaccpWorkExpiration => ({
            workId: '1',
            approvalId,
            expirationDate: '2026-10-20',
            equipmentId,
            materialType: '',
            certificationUserId: '',
            targetName,
        });

        const events = mapExpirationsToCalendarEvents(
            [buildItem({ expirationApply: true, divisionName: '검교정' })],
            [expiration('11', '저울 A', '901'), expiration('12', '온도계 B', '902')],
            ...OCT_2026,
        );

        expect(events.map((event) => event.item.title)).toEqual([
            '만료 | 검교정 - 저울 A',
            '만료 | 검교정 - 온도계 B',
        ]);
    });
});