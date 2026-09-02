import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { useWorkCalendarData } from '../pages/documents/work-calendar/hooks/useWorkCalendarData';
import { listHaccpWorkTodos } from '../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../shared/store/authStore';

vi.mock('../services/documents/haccpBaseWorkService', () => ({
    listHaccpWorkTodos: vi.fn(),
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
    });

    it('places a monthly-cycle item on the 1st of the viewed month', async () => {
        const { result } = renderHook(() => useWorkCalendarData(), {
            wrapper: AppProviders,
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.events).toHaveLength(1);
        expect(result.current.events[0].title).toBe('월간 점검 업무');
        expect(result.current.events[0].start.getDate()).toBe(1);
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
});