import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listHaccpWorkTodos } from '../../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../../shared/store/authStore';
import {
    toTenantTodoCardItem,
    type TenantTodoCardItem,
} from '../../../dashboard/tenant/hooks/useTenantDashboardData';
import { mapTodosToCalendarEvents } from '../cycleDateMapping';

export type WorkCalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay: true;
    resource: TenantTodoCardItem;
};

export function useWorkCalendarData() {
    const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
    const [viewDate, setViewDate] = useState(() => new Date());

    const {
        data: todoDocuments = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['haccp-work-todos', tenantCode],
        queryFn: async () => {
            const items = await listHaccpWorkTodos({ tenantCode });
            return items.map(toTenantTodoCardItem);
        },
        retry: 0,
    });

    const year = viewDate.getFullYear();
    const monthIndex0 = viewDate.getMonth();

    const events = useMemo<WorkCalendarEvent[]>(() => {
        const mapped = mapTodosToCalendarEvents(todoDocuments, year, monthIndex0);

        return mapped
        .slice()
        .sort((left, right) => {
            if (left.date !== right.date) {
                return left.date < right.date ? -1 : 1;
            }
            const orderDiff =
                (left.item.categorySortOrder ?? 0) -
                (right.item.categorySortOrder ?? 0);
            if (orderDiff !== 0) {
                return orderDiff;
            }
            return left.item.title.localeCompare(right.item.title, 'ko');
        })
        .map((mappedEvent) => {
            const start = new Date(`${mappedEvent.date}T00:00:00`);
            return {
                title: mappedEvent.item.title,
                start,
                end: start,
                allDay: true as const,
                resource: mappedEvent.item,
            };
        });
    }, [todoDocuments, year, monthIndex0]);

    return {
        viewDate,
        setViewDate,
        events,
        isLoading,
        isError,
        error,
    };
}