import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
    listHaccpWorkTodoCycles,
    listHaccpWorkTodos,
} from '../../../../services/documents/haccpBaseWorkService';
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
    // 기존 -> 상태는 resource(업무 1건)만 보유
    // 변경 -> 주기 기준일·미래 여부를 이벤트별로 보유
    cycleDate: string;
    isFuture: boolean;
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
    // 이번 주 월요일이 이전 달일 수 있어 조회 시작일을 6일 앞당긴다.
    const fromDate = dayjs(new Date(year, monthIndex0, 1))
    .subtract(6, 'day')
    .format('YYYY-MM-DD');
    const toDate = dayjs(new Date(year, monthIndex0 + 1, 0)).format('YYYY-MM-DD');

    const { data: cycleInstances = [] } = useQuery({
        queryKey: ['haccp-work-todo-cycles', tenantCode, fromDate, toDate],
        queryFn: () => listHaccpWorkTodoCycles({ tenantCode, fromDate, toDate }),
        retry: 0,
    });

    const events = useMemo<WorkCalendarEvent[]>(() => {
        const mapped = mapTodosToCalendarEvents(
            todoDocuments,
            year,
            monthIndex0,
            cycleInstances,
        );

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
                cycleDate: mappedEvent.cycleDate,
                isFuture: mappedEvent.isFuture,
                resource: mappedEvent.item,
            };
        });
    }, [todoDocuments, year, monthIndex0, cycleInstances]);

    return {
        viewDate,
        setViewDate,
        events,
        isLoading,
        isError,
        error,
    };
}