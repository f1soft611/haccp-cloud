import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import type { TenantTodoCardItem } from './hooks/useTenantDashboardData';
import { getWorkCycleLabel } from './utils';

export type TenantViewMode = 'list' | 'calendar';

export type TenantTodoFilter = {
  keyword: string;
  category: string;
  cycle: string;
  status: string;
};

export const EMPTY_TODO_FILTER: TenantTodoFilter = {
  keyword: '',
  category: '',
  cycle: '',
  status: '',
};

export const TODO_STATUS_OPTIONS = [
  '미작성',
  '임시저장',
  '결재진행중',
  '승인',
  '반려',
];

export function getTodoStatusLabel(item: TenantTodoCardItem): string {
  return resolveApprovalStatusView({
    approvalStatusType: item.approvalStatusType,
    approvalStatusTypeName: item.approvalStatusTypeName,
    todoStatus: item.status,
    writtenInCycle: item.writtenInCycle,
  }).label;
}

// 업무분류 라벨은 useTenantDashboardData의 섹션 라벨과 같은 규칙
export function matchesTodoFilter(
  item: TenantTodoCardItem,
  filter: TenantTodoFilter,
): boolean {
  const keyword = filter.keyword.trim().toLowerCase();
  const category = item.categoryName || item.categoryCode || '기타문서';
  return (
    (!keyword ||
      [item.title, item.divisionName]
        .filter(Boolean)
        .some((text) => text.toLowerCase().includes(keyword))) &&
    (!filter.category || category === filter.category) &&
    (!filter.cycle || getWorkCycleLabel(item) === filter.cycle) &&
    (!filter.status || getTodoStatusLabel(item) === filter.status)
  );
}
