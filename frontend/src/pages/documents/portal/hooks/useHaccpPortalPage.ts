import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listHaccpPortalDocuments } from '../../../../services/documents/haccpPortalService';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { PortalRow, PortalSearchValue } from '../types';

const INITIAL_SEARCH: PortalSearchValue = {
  category: 'ALL',
  cycle: 'ALL',
  keyword: '',
};

export function useHaccpPortalPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const userId = useAuthStore((state) => state.userId);
  const [search, setSearch] = useState<PortalSearchValue>(INITIAL_SEARCH);
  const [appliedSearch, setAppliedSearch] =
    useState<PortalSearchValue>(INITIAL_SEARCH);

  const documentsQuery = useQuery({
    queryKey: ['haccp-portal-documents', tenantCode, userId],
    queryFn: () => listHaccpPortalDocuments({ tenantCode }),
    retry: false,
  });

  const allRows = useMemo<PortalRow[]>(
    () =>
      (documentsQuery.data ?? []).map((item) => {
        const categoryName = item.categoryName || '기타문서';
        return {
          ...item,
          categoryName,
        };
      }),
    [documentsQuery.data],
  );

  const categoryOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.categoryName))],
    [allRows],
  );

  // ponytail: 포탈 API가 전체 목록을 주므로 클라이언트 필터링. 건수가 많아지면 서버 검색으로 전환
  const rows = useMemo(() => {
    const keyword = appliedSearch.keyword.trim().toLowerCase();
    return allRows.filter(
      (row) =>
        (appliedSearch.category === 'ALL' ||
          row.categoryName === appliedSearch.category) &&
        (appliedSearch.cycle === 'ALL' ||
            row.cycle === appliedSearch.cycle) &&
        (!keyword ||
          row.divisionName.toLowerCase().includes(keyword) ||
          row.assigneeSummary.toLowerCase().includes(keyword)),
    );
  }, [allRows, appliedSearch]);

  return {
    documentsQuery,
    search,
    setSearch,
    onSearch: () => {
      setAppliedSearch(search);
      void documentsQuery.refetch();
    },
    categoryOptions,
    rows,
  };
}
