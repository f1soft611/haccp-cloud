import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGridPagination } from '../shared/hooks/useGridPagination';

describe('useGridPagination', () => {
  it('resets to first page when page size changes', () => {
    const { result } = renderHook(() => useGridPagination());

    act(() => {
      result.current.setPageIndex(3);
      result.current.setPageSize(20);
    });

    expect(result.current.pageIndex).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });

  it('supports explicit resetPage', () => {
    const { result } = renderHook(() => useGridPagination());

    act(() => {
      result.current.setPageIndex(4);
      result.current.resetPage();
    });

    expect(result.current.pageIndex).toBe(1);
  });
});
