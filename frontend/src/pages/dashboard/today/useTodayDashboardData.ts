import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { listHaccpWorkTodoCycles } from '../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../shared/store/authStore';
import { mapTodosToCalendarEvents } from '../../documents/work-calendar/cycleDateMapping';
import { useTenantDashboardData } from '../tenant/hooks/useTenantDashboardData';
import { buildBoard, buildHistoryByWork, compareByCategory, type HistoryCell } from './todayRules';

// 기존 종합현황 훅(todos, 결재할 문서)을 그대로 쓰고, 이력 칸용 주기 문서만 1년 범위로 더 조회한다
export function useTodayDashboardData(today: Date) {
    const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
    const { todoSections, approvalSections, isTodoLoading, isTodoError, isApprovalLoading } =
        useTenantDashboardData();

    const todos = useMemo(() => todoSections.flatMap((section) => section.items), [todoSections]);
    // 결재할 문서는 도착이 오래된 순
    const approvals = useMemo(
        () =>
            approvalSections
            .flatMap((section) => section.items)
            .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt)),
        [approvalSections],
    );

    const fromDate = dayjs(today).subtract(1, 'year').format('YYYY-MM-DD');
    const toDate = dayjs(today).format('YYYY-MM-DD');
    const {
        data: cycles,
        isLoading: isHistoryLoading,
        isError: isHistoryError,
    } = useQuery({
        queryKey: ['haccp-work-todo-cycles', tenantCode, fromDate, toDate],
        queryFn: () => listHaccpWorkTodoCycles({ tenantCode, fromDate, toDate }),
        retry: 0,
    });

    const board = useMemo(() => buildBoard(todos, today), [todos, today]);
    const statusRows = useMemo(() => [...todos].sort(compareByCategory), [todos]);
    const historyByWork = useMemo(
        () =>
            cycles
                ? buildHistoryByWork(
                    mapTodosToCalendarEvents(
                        todos,
                        fromDate,
                        toDate,
                        cycles.instances,
                        today,
                        cycles.displayStartDate,
                    ),
                )
                : new Map<string, HistoryCell[]>(),
        [cycles, todos, fromDate, toDate, today],
    );

    return {
        board,
        approvals,
        statusRows,
        historyByWork,
        isTodoLoading,
        isTodoError,
        isApprovalLoading,
        isHistoryLoading,
        isHistoryError,
    };
}