import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
                cycle: '월간',
                title: '월간 점검 업무',
                active: true,
                assigneeIds: [],
                referenceIds: [],
                assigneeMapped: true,
                hasDocument: true,
                writtenInCycle: false,
            },
        ]);

        vi.mocked(listHaccpWorkTodoCycles).mockReset();
        vi.mocked(listHaccpWorkTodoCycles).mockResolvedValue([]);
    });

    // 기존 -> 이번 달 월주기 업무는 1일에 표시
    // 변경 -> 이번 달(진행 중) 월주기 업무는 오늘 칸에 표시
    it('places a current-month monthly item on today', async () => {
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.events).toHaveLength(1);
        expect(result.current.events[0].title).toBe('월간 점검 업무');
        expect(result.current.events[0].start.getDate()).toBe(new Date().getDate());
        expect(result.current.events[0].isFuture).toBe(false);
    });

    it('moves the event to next month after navigating forward', async () => {
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const now = result.current.viewDate;
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        act(() => {
            result.current.setViewDate(nextMonth);
        });

        await waitFor(() => {
            expect(result.current.events[0].start.getMonth()).toBe(
                nextMonth.getMonth(),
            );
        });
    });

    it('requests cycle instances from 6 days before the 1st to the month end', async () => {
        renderHook(() => useWorkCalendarData(), { wrapper: AppProviders });

        await waitFor(() => expect(listHaccpWorkTodoCycles).toHaveBeenCalled());

        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const from = new Date(first);
        from.setDate(first.getDate() - 6);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const fmt = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        expect(listHaccpWorkTodoCycles).toHaveBeenCalledWith({
            tenantCode: 'TENANT-A',
            fromDate: fmt(from),
            toDate: fmt(last),
        });
    });
});