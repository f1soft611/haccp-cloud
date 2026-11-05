import { describe, expect, it } from 'vitest';
import type { TenantTodoCardItem } from '../../../pages/dashboard/tenant/hooks/useTenantDashboardData.ts';
import {
    countCumulativeStatuses,
    countTodoStatuses,
    EMPTY_TODO_FILTER,
    matchesTodoFilter,
    PENDING_APPROVAL_STATUS,
} from '../../../pages/dashboard/tenant/todoFilter.ts';

const item = {
  id: 'W1',
  title: '냉장고 온도 점검',
  divisionName: '냉장고 온도 점검',
  categoryName: '위생관리',
  cycle: 'DAY',
  status: 'DRAFT',
  writtenInCycle: false,
} as TenantTodoCardItem;

describe('matchesTodoFilter', () => {
  it('matches everything with an empty filter', () => {
    expect(matchesTodoFilter(item, EMPTY_TODO_FILTER)).toBe(true);
  });

  it('filters by keyword, category, cycle and status', () => {
    const f = (patch: Partial<typeof EMPTY_TODO_FILTER>) =>
      matchesTodoFilter(item, { ...EMPTY_TODO_FILTER, ...patch });

    expect(f({ keyword: '온도' })).toBe(true);
    expect(f({ keyword: '세척' })).toBe(false);
    expect(f({ category: '위생관리' })).toBe(true);
    expect(f({ category: '공정관리' })).toBe(false);
    expect(f({ cycle: 'DAY' })).toBe(true);
    expect(f({ cycle: 'MONTH' })).toBe(false);
    expect(f({ status: '미작성' })).toBe(true);
    expect(f({ status: '승인' })).toBe(false);
  });
});

const withStatus = (
    approvalStatusTypeName: string,
    approvalStatusType?: string,
) =>
    ({
      ...item,
      approvalStatusType,
      approvalStatusTypeName,
    }) as TenantTodoCardItem;

describe('matchesTodoFilter status rules', () => {
  it('includes 임시저장 items in the 미작성 filter', () => {
    const preApply = withStatus('임시저장');
    expect(
        matchesTodoFilter(preApply, { ...EMPTY_TODO_FILTER, status: '미작성' }),
    ).toBe(true);
    // 기존 -> status: '임시저장' 필터도 true / 변경 -> 임시저장 필터 옵션 제거, 단언 삭제
  });

  it('ignores the status condition for 결재할문서 but keeps other conditions', () => {
    const approved = withStatus('승인', 'approved');
    expect(
        matchesTodoFilter(approved, {
          ...EMPTY_TODO_FILTER,
          status: PENDING_APPROVAL_STATUS,
        }),
    ).toBe(true);
    expect(
        matchesTodoFilter(approved, {
          ...EMPTY_TODO_FILTER,
          status: PENDING_APPROVAL_STATUS,
          keyword: '세척',
        }),
    ).toBe(false);
  });
});

describe('countTodoStatuses', () => {
  // 기존 -> 'counts card statuses, folding 임시저장 into 미작성' / 변경 -> 임시저장은 라벨부터 미작성
  it('counts card statuses, 임시저장 shows as 미작성', () => {
    const counts = countTodoStatuses(
        [
          item,
          withStatus('임시저장'),
          withStatus('결재진행중', 'in_progress'),
          withStatus('승인', 'approved'),
          withStatus('승인', 'approved'),
          withStatus('반려', 'rejected'),
        ],
        3,
    );
    expect(counts).toEqual({
      미작성: 2,
      결재할문서: 3,
      결재진행중: 1,
      승인: 2,
      반려: 1,
    });
  });
});

describe('countCumulativeStatuses', () => {
    it('sums cumulative cycle counts of todos and keeps the pending approval count', () => {
        const counts = countCumulativeStatuses(
            [
                {
                    ...item,
                    unwrittenCount: 2,
                    inProgressCycleCount: 1,
                    approvedCycleCount: 10,
                    rejectedCycleCount: 0,
                },
                {
                    ...item,
                    id: 'W2',
                    unwrittenCount: 3,
                    inProgressCycleCount: 0,
                    approvedCycleCount: 5,
                    rejectedCycleCount: 2,
                },
                {
                    ...item,
                    id: 'W3',
                    cycle: 'ANYTIME',
                    unwrittenCount: 0,
                    inProgressCycleCount: 0,
                    approvedCycleCount: 0,
                    rejectedCycleCount: 0,
                },
            ],
            4,
        );
        expect(counts).toEqual({
            미작성: 5,
            결재할문서: 4,
            결재진행중: 1,
            승인: 15,
            반려: 2,
        });
    });
});