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

    // 기존 -> 보는 달 1일 - 6일 ~ 말일을 조회하고 보는 달에만 표시
    // 변경 -> 달력에 보이는 첫 칸(일요일) ~ 마지막 칸(토요일)에 표시
    const rangeStart = dayjs(viewDate).startOf('month').startOf('week').format('YYYY-MM-DD');
    const rangeEnd = dayjs(viewDate).endOf('month').endOf('week').format('YYYY-MM-DD');
    const monthFrom = dayjs(rangeStart)
    .subtract(6, 'day')
    .startOf('month')
    .format('YYYY-MM-DD');
    const yearFrom = dayjs().startOf('year').format('YYYY-MM-DD');
    const fromDate = monthFrom < yearFrom ? monthFrom : yearFrom;
    const toDate = rangeEnd;

    const { data: cycleInstances = [] } = useQuery({
        queryKey: ['haccp-work-todo-cycles', tenantCode, fromDate, toDate],
        queryFn: () => listHaccpWorkTodoCycles({ tenantCode, fromDate, toDate }),
        retry: 0,
    });

    const events = useMemo<WorkCalendarEvent[]>(() => {
        const mapped = mapTodosToCalendarEvents(
            todoDocuments,
            rangeStart,
            rangeEnd,
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
    }, [todoDocuments, rangeStart, rangeEnd, cycleInstances]);

    return {
        viewDate,
        setViewDate,
        events,
        isLoading,
        isError,
        error,
    };
}