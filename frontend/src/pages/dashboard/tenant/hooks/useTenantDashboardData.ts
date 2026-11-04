import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import { getDashboardMetrics } from '../../../../services/documents/dashboardService';
import {
  listHaccpWorkApprovalAlerts,
  listHaccpWorkTodos,
} from '../../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../../shared/store/authStore';

export type TenantTodoCardItem = HaccpBaseWorkItem & {
  title: string;
  category: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'ACTIVE';
  updatedBy: string;
  updatedAt: string;
  writtenInCycle: boolean;
  routeIdType: 'work' | 'approval';
  routeId: string;
  dDay: string;
  unwrittenCount: number;
  inProgressCycleCount: number;
  approvedCycleCount: number;
  rejectedCycleCount: number;
};

export type TenantTodoSectionModel = {
  key: string;
  label: string;
  sortOrder: number;
  items: TenantTodoCardItem[];
};

export function computeDDay(cycleEndDate?: string): string {
  if (!cycleEndDate || cycleEndDate.length !== 8) return '';
  const end = new Date(
    Number(cycleEndDate.slice(0, 4)),
    Number(cycleEndDate.slice(4, 6)) - 1,
    Number(cycleEndDate.slice(6, 8)),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
}

export function toTenantTodoCardItem(
    item: HaccpBaseWorkItem,
): TenantTodoCardItem {
  return {
    ...item,
    title: item.title || item.divisionName || item.categoryName || '업무',
    category: item.categoryName || '기타문서',
    status: item.todoStatus || 'DRAFT',
    updatedBy: item.owner || item.createdBy || '없음',
    // 기존 -> 결재 도착일시 || 최종 상태 일시 || 생성일시
    // 변경 -> 본인 작성 문서의 가장 큰 보고일자(report_date)
    updatedAt: item.lastReportDate || '',
    writtenInCycle: Boolean(item.writtenInCycle),
    routeIdType: item.approvalId ? ('approval' as const) : ('work' as const),
    routeId: item.approvalId || item.id,
    dDay: computeDDay(item.cycleEndDate),
    unwrittenCount: item.unwrittenCount ?? 0,
    inProgressCycleCount: item.inProgressCycleCount ?? 0,
    approvedCycleCount: item.approvedCycleCount ?? 0,
    rejectedCycleCount: item.rejectedCycleCount ?? 0,
  };
}

// todos·결재할 문서 공통: 업무분류별로 묶고 분류 정렬순서 → 이름순 정렬
function groupTodoSections(
    items: TenantTodoCardItem[],
): TenantTodoSectionModel[] {
  const grouped = new Map<
      string,
      { label: string; sortOrder: number; items: TenantTodoCardItem[] }
  >();

  items.forEach((item) => {
    const key = item.categoryCode || item.categoryName || 'uncategorized';
    const label = item.categoryName || item.categoryCode || '기타문서';
    const sortOrder = Number.isFinite(item.categorySortOrder)
        ? item.categorySortOrder
        : 0;
    const bucket = grouped.get(key) ?? { label, sortOrder, items: [] };
    bucket.label = label;
    bucket.sortOrder = Math.min(bucket.sortOrder, sortOrder);
    bucket.items.push(item);
    grouped.set(key, bucket);
  });

  return [...grouped.entries()]
  .map(([key, value]) => ({
    key,
    label: value.label,
    sortOrder: value.sortOrder,
    items: value.items,
  }))
  .sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.label.localeCompare(right.label, 'ko');
  });
}

export function useTenantDashboardData() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');

  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useQuery({
    queryKey: ['dashboard', tenantCode],
    queryFn: () => getDashboardMetrics(tenantCode),
    retry: 0,
  });
  const {
    data: todoDocuments = [],
    isLoading: isDocumentsLoading,
    isError: isTodoError,
  } = useQuery({
    queryKey: ['haccp-work-todos', tenantCode],
    queryFn: async () => {
      const items = await listHaccpWorkTodos({ tenantCode });
      return items.map(toTenantTodoCardItem);
    },
    retry: 0,
  });

  const {
    data: approvalAlertDocuments = [],
    isLoading: isApprovalLoading,
  } = useQuery({
    queryKey: ['haccp-work-approval-alerts', tenantCode],
    queryFn: async () => {
      const items = await listHaccpWorkApprovalAlerts({ tenantCode });
      return items.map((item) => ({
        ...item,
        title: item.title || '-',
        category: item.categoryName || '기타문서',
        status: item.todoStatus || 'DRAFT',
        updatedBy: item.owner || item.createdBy || '없음',
        updatedAt:
          item.pendingArrivalAt || item.latestStatusAt || item.createdAt || '',
        writtenInCycle: Boolean(item.writtenInCycle),
        routeIdType: item.approvalId
          ? ('approval' as const)
          : ('work' as const),
        routeId: item.approvalId || item.id,
        dDay: computeDDay(item.cycleEndDate),
        unwrittenCount: item.unwrittenCount ?? 0,
        inProgressCycleCount: item.inProgressCycleCount ?? 0,
        approvedCycleCount: item.approvedCycleCount ?? 0,
        rejectedCycleCount: item.rejectedCycleCount ?? 0,
      }));
    },
    retry: 0,
  });

  const totalDocuments = metrics?.totalDocuments ?? 0;
  const draftDocuments = metrics?.draftTemplates ?? 0;
  const updatedToday = metrics?.updatedToday ?? 0;
  const activeDocuments = Math.max(totalDocuments - draftDocuments, 0);
  const ccpCompletion =
    totalDocuments === 0
      ? 0
      : Math.round((activeDocuments / totalDocuments) * 100);
  const uncheckedCount = Math.max(totalDocuments - updatedToday, 0);
  const todayActionCount = uncheckedCount + draftDocuments;

  const todoSections = useMemo(
      () => groupTodoSections(todoDocuments),
      [todoDocuments],
  );

  const pendingApprovals = useMemo(() => {
    const unique = new Map<string, TenantTodoCardItem>();

    approvalAlertDocuments.forEach((item) => {
      const routeId = String(
          item.routeId || item.approvalId || item.id || '',
      ).trim();
      if (!routeId) {
        return;
      }

      if (!unique.has(routeId)) {
        unique.set(routeId, item);
      }
    });

    return [...unique.values()];
  }, [approvalAlertDocuments]);

  const approvalAlerts = useMemo(
      () => pendingApprovals.slice(0, 6),
      [pendingApprovals],
  );

  const approvalSections = useMemo(
      () => groupTodoSections(pendingApprovals),
      [pendingApprovals],
  );

  return {
    ccpCompletion,
    uncheckedCount,
    draftDocuments,
    todayActionCount,
    todoSections,
    approvalAlerts,
    isMetricsLoading,
    isTodoLoading: isDocumentsLoading,
    isMetricsError,
    isTodoError,
    approvalSections,
    isApprovalLoading,
  };
}
