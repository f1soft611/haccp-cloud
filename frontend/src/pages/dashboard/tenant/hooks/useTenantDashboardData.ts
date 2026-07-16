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
};

export type TenantTodoSectionModel = {
  key: string;
  label: string;
  sortOrder: number;
  items: TenantTodoCardItem[];
};

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
      return items.map((item) => ({
        ...item,
        title: item.divisionName || item.categoryName || '업무',
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
      }));
    },
    retry: 0,
  });

  const { data: approvalAlertDocuments = [] } = useQuery({
    queryKey: ['haccp-work-approval-alerts', tenantCode],
    queryFn: async () => {
      const items = await listHaccpWorkApprovalAlerts({ tenantCode });
      return items.map((item) => ({
        ...item,
        title: item.divisionName || item.categoryName || '업무',
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

  const todoSections = useMemo<TenantTodoSectionModel[]>(() => {
    const grouped = new Map<
      string,
      { label: string; sortOrder: number; items: TenantTodoCardItem[] }
    >();

    todoDocuments.forEach((item) => {
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
  }, [todoDocuments]);

  const approvalAlerts = useMemo(() => {
    return approvalAlertDocuments.slice(0, 6);
  }, [approvalAlertDocuments]);

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
  };
}
