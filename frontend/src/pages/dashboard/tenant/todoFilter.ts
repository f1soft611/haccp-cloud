import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import type { TenantTodoCardItem } from './hooks/useTenantDashboardData';

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

// 결재대기중 = 내가 결재할 문서(approval-alerts). 리스트 데이터 자체를 바꾸는 상태값
export const PENDING_APPROVAL_STATUS = '결재대기중';

export const TODO_STATUS_OPTIONS = [
  '미작성',
  '임시저장',
  PENDING_APPROVAL_STATUS,
  '결재진행중',
  '승인',
  '반려',
];

// 상태 카드 순서
export const STATUS_CARD_KEYS = [
  '미작성',
  PENDING_APPROVAL_STATUS,
  '결재진행중',
  '승인',
  '반려',
] as const;

export type TodoStatusCardKey = (typeof STATUS_CARD_KEYS)[number];
export type TodoStatusCounts = Record<TodoStatusCardKey, number>;

export function getTodoStatusLabel(item: TenantTodoCardItem): string {
  return resolveApprovalStatusView({
    approvalStatusType: item.approvalStatusType,
    approvalStatusTypeName: item.approvalStatusTypeName,
    todoStatus: item.status,
    writtenInCycle: item.writtenInCycle,
  }).label;
}

// 미작성은 결재를 아직 올리지 않은 임시저장도 포함, 결재대기중은 데이터 교체로 처리하므로 상태 조건 없음
function matchesTodoStatus(item: TenantTodoCardItem, status: string): boolean {
  if (!status || status === PENDING_APPROVAL_STATUS) {
    return true;
  }
  const label = getTodoStatusLabel(item);
  return status === '미작성'
      ? label === '미작성' || label === '임시저장'
      : label === status;
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
    // 기존 -> (!filter.cycle || item.cycle === filter.cycle) &&
    // 변경 -> 전체('')는 수시 제외, 수시는 직접 선택했을 때만 조회
    (filter.cycle ? item.cycle === filter.cycle : item.cycle !== 'ANYTIME') &&
    matchesTodoStatus(item, filter.status)
  );
}

// 상태 카드 건수: todos는 라벨별로 세고(임시저장 → 미작성), 결재대기중은 approval-alerts 건수
export function countTodoStatuses(
    todos: TenantTodoCardItem[],
    pendingApprovalCount: number,
): TodoStatusCounts {
  const counts: TodoStatusCounts = {
    미작성: 0,
    결재대기중: pendingApprovalCount,
    결재진행중: 0,
    승인: 0,
    반려: 0,
  };
  todos.forEach((todo) => {
    const label = getTodoStatusLabel(todo);
    const key = label === '임시저장' ? '미작성' : label;
    if (key in counts && key !== PENDING_APPROVAL_STATUS) {
      counts[key as TodoStatusCardKey] += 1;
    }
  });
  return counts;
}

// 오늘이 있는 달 캘린더 이벤트 중 미래가 아닌 것(주기 단위)으로 셈, 결재대기중은 그대로
export function countCurrentMonthStatuses(
    events: { isFuture: boolean; resource: TenantTodoCardItem }[],
    pendingApprovalCount: number,
): TodoStatusCounts {
  return countTodoStatuses(
      events.filter((event) => !event.isFuture).map((event) => event.resource),
      pendingApprovalCount,
  );
}