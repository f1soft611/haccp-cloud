import { useMemo } from 'react';
import { useSessionState } from '../../../../shared/hooks/useSessionState';
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
import { mapExpirationsToCalendarEvents, mapTodosToCalendarEvents } from '../cycleDateMapping';
import type { HaccpWorkExpiration } from '../../../../services/documents/haccpBaseWorkService';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { getCommonCodeName, useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';

export type WorkCalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay: true;
    cycleDate: string;
    isFuture: boolean;
    resource: TenantTodoCardItem;
    expiration?: HaccpWorkExpiration;   // 만료일 이벤트면 만료 문서 정보 (클릭 시 대상 미리 선택 경로)
};

export function useCalendarMonthEvents(monthDate: Date) {
    const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
    const materialTypeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.MATERIAL_TYPE);

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
    const rangeStart = dayjs(monthDate).startOf('month').startOf('week').format('YYYY-MM-DD');
    const rangeEnd = dayjs(monthDate).endOf('month').endOf('week').format('YYYY-MM-DD');
    const monthFrom = dayjs(rangeStart)
    .subtract(6, 'day')
    .startOf('month')
    .format('YYYY-MM-DD');
    const yearFrom = dayjs().startOf('year').format('YYYY-MM-DD');
    const fromDate = monthFrom < yearFrom ? monthFrom : yearFrom;
    const toDate = rangeEnd;

    // 주기 조회 로딩 상태도 받아 전체 로딩에 합침
    const { data: cycles, isLoading: isCyclesLoading } = useQuery({
        queryKey: ['haccp-work-todo-cycles', tenantCode, fromDate, toDate],
        queryFn: () => listHaccpWorkTodoCycles({ tenantCode, fromDate, toDate }),
        retry: 0,
    });

    const events = useMemo<WorkCalendarEvent[]>(() => {
        if (!cycles) {
            return [];
        }
        const mapped = [
            ...mapTodosToCalendarEvents(
                todoDocuments,
                rangeStart,
                rangeEnd,
                cycles.instances,
                new Date(),
                cycles.displayStartDate,
                (code) => getCommonCodeName(materialTypeOptions, code),
            ),
            ...mapExpirationsToCalendarEvents(
                todoDocuments,
                cycles.expirations,
                rangeStart,
                rangeEnd,
                (code) => getCommonCodeName(materialTypeOptions, code),
            ),
        ];

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
                expiration: mappedEvent.expiration,
            };
        });
    }, [todoDocuments, rangeStart, rangeEnd, cycles, materialTypeOptions]);

    return { events, isLoading: isLoading || isCyclesLoading, isError, error };
}

export function useWorkCalendarData() {
    // 기존 -> useState(new Date()) : 문서 화면에서 돌아오면 이번 달로 초기화
    // 변경 -> 보던 달을 sessionStorage에 저장해 돌아와도 유지 (Date는 문자열로 저장)
    const [viewDateText, setViewDateText] = useSessionState(
        'workCalendar.viewDate',
        () => new Date().toISOString(),
    );
    const viewDate = useMemo(() => new Date(viewDateText), [viewDateText]);
    const setViewDate = (date: Date) => setViewDateText(date.toISOString());

    const { events, isLoading, isError, error } = useCalendarMonthEvents(viewDate);

    return {
        viewDate,
        setViewDate,
        events,
        isLoading,
        isError,
        error,
    };
}