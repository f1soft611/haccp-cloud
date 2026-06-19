import { useState } from 'react';

export const GRID_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function isAllowedPageSize(
  size: number,
): size is (typeof GRID_PAGE_SIZE_OPTIONS)[number] {
  return GRID_PAGE_SIZE_OPTIONS.includes(
    size as (typeof GRID_PAGE_SIZE_OPTIONS)[number],
  );
}

export function useGridPagination(initialPageSize = 10) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSizeState] = useState(
    isAllowedPageSize(initialPageSize) ? initialPageSize : 10,
  );

  const setPageSize = (nextPageSize: number) => {
    if (!isAllowedPageSize(nextPageSize)) {
      return;
    }
    setPageSizeState(nextPageSize);
    setPageIndex(1);
  };

  const resetPage = () => setPageIndex(1);

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    resetPage,
    pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,
  };
}
