import { describe, expect, it } from 'vitest';
import type { TenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import {
  EMPTY_TODO_FILTER,
  matchesTodoFilter,
} from '../pages/dashboard/tenant/todoFilter';

const item = {
  id: 'W1',
  title: '냉장고 온도 점검',
  divisionName: '냉장고 온도 점검',
  categoryName: '위생관리',
  cycle: '일',
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
    expect(f({ cycle: '일' })).toBe(true);
    expect(f({ cycle: '월' })).toBe(false);
    expect(f({ status: '미작성' })).toBe(true);
    expect(f({ status: '승인' })).toBe(false);
  });
});
