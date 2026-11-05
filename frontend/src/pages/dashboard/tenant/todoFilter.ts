import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import type { TenantTodoCardItem } from './hooks/useTenantDashboardData';

export type TenantViewMode = 'list' | 'calendar';

// 나의 담당업무 카드 목록의 문서 구분
export type TenantDocScope = 'all' | 'draft' | 'approval';

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

// 기존 -> 진행상태 칩과 같은 상수 사용
// 변경 -> 칩에서 쓰지 않으므로 필터 값으로 직접 선언
export const PENDING_APPROVAL_STATUS = '결재할문서';

export const TODO_STATUS_OPTIONS = [
  '미작성',
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
// 상태바의 기안문서 건수 순서 (결재할문서는 따로 표시)
export const DRAFT_STATUS_CARD_KEYS = ['미작성', '결재진행중', '승인', '반려'] as const;

export function getTodoStatusLabel(item: TenantTodoCardItem): string {
  return resolveApprovalStatusView({
    approvalStatusType: item.approvalStatusType,
    approvalStatusTypeName: item.approvalStatusTypeName,
    todoStatus: item.status,
    writtenInCycle: item.writtenInCycle,
  }).label;
}

// 결재할문서은 데이터 교체로 처리하므로 상태 조건 없음 (임시저장은 라벨이 이미 미작성)
function matchesTodoStatus(item: TenantTodoCardItem, status: string): boolean {
  if (!status || status === PENDING_APPROVAL_STATUS) {
    return true;
  }
  // 기존 -> status === '미작성' ? label === '미작성' || label === '임시저장' : label === status
  // 변경 -> 임시저장도 미작성 라벨로 오므로 라벨 비교만
  return getTodoStatusLabel(item) === status;
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

// 상태 카드 건수: todos는 라벨별로 세고, 결재할문서은 approval-alerts 건수
export function countTodoStatuses(
    todos: TenantTodoCardItem[],
    pendingApprovalCount: number,
): TodoStatusCounts {
  const counts: TodoStatusCounts = {
    미작성: 0,
    결재할문서: pendingApprovalCount,
    결재진행중: 0,
    승인: 0,
    반려: 0,
  };
  todos.forEach((todo) => {
    // 기존 -> const label = ...; const key = label === '임시저장' ? '미작성' : label;
    // 변경 -> 임시저장도 미작성 라벨로 오므로 그대로 사용
    const key = getTodoStatusLabel(todo);
    if (key in counts && key !== PENDING_APPROVAL_STATUS) {
      counts[key as TodoStatusCardKey] += 1;
    }
  });
  return counts;
}

// 업무카드별 서비스 시작일부터 누적 주기 수 합(검색조건 무관), 결재할문서은 approval-alerts 건수
export function countCumulativeStatuses(
    todos: TenantTodoCardItem[],
    pendingApprovalCount: number,
): TodoStatusCounts {
  const sum = (pick: (todo: TenantTodoCardItem) => number) =>
      todos.reduce((total, todo) => total + (pick(todo) ?? 0), 0);
  return {
    미작성: sum((todo) => todo.unwrittenCount),
    결재할문서: pendingApprovalCount,
    결재진행중: sum((todo) => todo.inProgressCycleCount),
    승인: sum((todo) => todo.approvedCycleCount),
    반려: sum((todo) => todo.rejectedCycleCount),
  };
}