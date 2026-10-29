import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { listHaccpWorkTodoCycles } from '../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../shared/store/authStore';
import { mapTodosToCalendarEvents } from '../../documents/work-calendar/cycleDateMapping';
import { useTenantDashboardData } from '../tenant/hooks/useTenantDashboardData';
import { buildBoard, buildHistoryByWork, compareByCategory, EXPIRATION_LEAD_DAYS, type HistoryCell } from './todayRules';
import { COMMON_CODE_GROUP } from '../../../shared/constants/commonCodeGroups';
import { getCommonCodeName, useCommonCodeOptions } from '../../../shared/hooks/useCommonCodeOptions';

// 기존 종합현황 훅(todos, 결재할 문서)을 그대로 쓰고, 이력 칸용 주기 문서만 1년 범위로 더 조회한다
export function useTodayDashboardData(today: Date) {
    const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
    const materialTypeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.MATERIAL_TYPE);
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
    const todayDate = dayjs(today).format('YYYY-MM-DD');
    // 기존 -> 오늘까지 조회 / 변경 -> 만료일 관리 건을 위해 오늘 + 30일까지 조회 (이력 칸은 오늘까지만 씀)
    const toDate = dayjs(today).add(EXPIRATION_LEAD_DAYS, 'day').format('YYYY-MM-DD');
    const {
        data: cycles,
        isLoading: isHistoryLoading,
        isError: isHistoryError,
    } = useQuery({
        queryKey: ['haccp-work-todo-cycles', tenantCode, fromDate, toDate],
        queryFn: () => listHaccpWorkTodoCycles({ tenantCode, fromDate, toDate }),
        retry: 0,
    });

    // 기존 -> buildBoard(todos, today) / 변경 -> 만료 목록과 품목유형 이름도 넘김
    const board = useMemo(
        () =>
            buildBoard(todos, today, cycles?.expirations ?? [], (code) =>
                getCommonCodeName(materialTypeOptions, code),
            ),
        [todos, today, cycles, materialTypeOptions],
    );
    const statusRows = useMemo(() => [...todos].sort(compareByCategory), [todos]);
    const historyByWork = useMemo(
        () =>
            cycles
                ? buildHistoryByWork(
                    mapTodosToCalendarEvents(
                        todos,
                        fromDate,
                        todayDate,
                        cycles.instances,
                        today,
                        cycles.displayStartDate,
                    ),
                )
                : new Map<string, HistoryCell[]>(),
        [cycles, todos, fromDate, todayDate, today],
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