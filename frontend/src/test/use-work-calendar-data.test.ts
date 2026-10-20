import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { useWorkCalendarData } from '../pages/documents/work-calendar/hooks/useWorkCalendarData';
import {
    listHaccpWorkTodoCycles,
    listHaccpWorkTodos,
} from '../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../shared/store/authStore';

vi.mock('../services/documents/haccpBaseWorkService', () => ({
    listHaccpWorkTodos: vi.fn(),
    listHaccpWorkTodoCycles: vi.fn(),
}));

describe('useWorkCalendarData', () => {
    beforeEach(() => {
        // 실제 날짜에 따라 다음 달 1일이 화면에 보이면 이벤트 개수가 달라지므로 오늘을 고정한다.
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 12));
        useAuthStore.setState({ tenantCode: 'TENANT-A' });
        vi.mocked(listHaccpWorkTodos).mockReset();
        vi.mocked(listHaccpWorkTodos).mockResolvedValue([
            {
                id: 'wc-1',
                tenantCode: 'TENANT-A',
                categoryGroupId: '10',
                categoryCode: 'HA',
                categoryName: 'HACCP (HA)',
                categorySortOrder: 1,
                divisionCode: '001',
                divisionName: '월간 점검',
                cycle: 'MONTH', cycleName: '월',
                title: '월간 점검',
                active: true,
                assigneeIds: [],
                referenceIds: [],
                assigneeMapped: true,
                hasDocument: true,
                writtenInCycle: false,
            },
        ]);

        vi.mocked(listHaccpWorkTodoCycles).mockReset();
        vi.mocked(listHaccpWorkTodoCycles).mockResolvedValue({ instances: [], displayStartDate: '' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // 기존 -> 이번 달 월주기 업무는 1일에 표시
    // 변경 -> 이번 달(진행 중) 월주기 업무는 오늘 칸에 표시
    it('places a current-month monthly item on today', async () => {
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.events).toHaveLength(1);
        expect(result.current.events[0].title).toBe('월간 점검');
        expect(result.current.events[0].start).toEqual(new Date(2026, 9, 12));
        expect(result.current.events[0].isFuture).toBe(false);
    });

    // 기존 -> 다음 달 1일 이벤트 1건 / 변경 -> 보이는 범위의 12-01 이벤트도 포함
    it('moves events to the next month view after navigating forward', async () => {
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.setViewDate(new Date(2026, 10, 1));
        });

        await waitFor(() => {
            expect(result.current.events.map((event) => event.start)).toEqual([
                new Date(2026, 10, 1),
                new Date(2026, 11, 1),
            ]);
        });
    });

    // 기존 -> (보이는 범위 시작일 - 6일)이 속한 달 1일 ~ 보이는 범위 종료일
    // 변경 -> 위 시작일과 올해 1월 1일 중 이른 날 ~ 보이는 범위 종료일 (연간 진행 주기 인스턴스 포함)
    it('requests cycle instances covering the visible range and the current year', async () => {
        renderHook(() => useWorkCalendarData(), { wrapper: AppProviders });

        await waitFor(() => expect(listHaccpWorkTodoCycles).toHaveBeenCalled());

        expect(listHaccpWorkTodoCycles).toHaveBeenCalledWith({
            tenantCode: 'TENANT-A',
            fromDate: '2026-01-01',
            toDate: '2026-10-31',
        });
    });

    it('hides cycles before the display start date', async () => {
        vi.mocked(listHaccpWorkTodoCycles).mockResolvedValue({
            instances: [],
            displayStartDate: '2026-11-01',
        });
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(listHaccpWorkTodoCycles).toHaveBeenCalled());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // 10월 월주기(기준일 10-01)는 표시 시작일(11-01)이 속한 주기보다 이르므로 제외
        await waitFor(() => expect(result.current.events).toEqual([]));
    });
});