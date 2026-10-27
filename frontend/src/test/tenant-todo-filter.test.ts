import { describe, expect, it } from 'vitest';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import {
    countCurrentMonthStatuses,
    countTodoStatuses,
    EMPTY_TODO_FILTER,
    matchesTodoFilter,
    PENDING_APPROVAL_STATUS,
} from '../pages/dashboard/tenant/todoFilter';

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
    expect(
        matchesTodoFilter(preApply, { ...EMPTY_TODO_FILTER, status: '임시저장' }),
    ).toBe(true);
  });

  it('ignores the status condition for 결재대기중 but keeps other conditions', () => {
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
  it('counts card statuses, folding 임시저장 into 미작성', () => {
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
      결재대기중: 3,
      결재진행중: 1,
      승인: 2,
      반려: 1,
    });
  });
});

describe('countCurrentMonthStatuses', () => {
    it('counts only non-future calendar events and keeps the pending approval count', () => {
        const counts = countCurrentMonthStatuses(
            [
                { isFuture: false, resource: item },
                { isFuture: false, resource: withStatus('승인', 'approved') },
                { isFuture: true, resource: item },
                { isFuture: true, resource: withStatus('반려', 'rejected') },
            ],
            2,
        );
        expect(counts).toEqual({
            미작성: 1,
            결재대기중: 2,
            결재진행중: 0,
            승인: 1,
            반려: 0,
        });
    });
});