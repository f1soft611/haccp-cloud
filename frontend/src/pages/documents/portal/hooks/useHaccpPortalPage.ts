import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listHaccpBaseCategories } from '../../../../services/documents/haccpBaseCategoryService';
import { listHaccpPortalDocuments } from '../../../../services/documents/haccpPortalService';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { PortalRow, PortalSearchValue } from '../types';

const INITIAL_SEARCH: PortalSearchValue = {
  category: 'ALL',
  cycle: 'ALL',
  keyword: '',
};

// 분류 미지정 업무(화면 표시명 '기타문서')를 조회할 때 서버로 보내는 업무분류 값
export const UNCATEGORIZED_CATEGORY = 'NONE';

// 문서포탈 검색조건, 서버 조건 조회, 업무분류 선택지를 관리한다
export function useHaccpPortalPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const userId = useAuthStore((state) => state.userId);
  const [search, setSearch] = useState<PortalSearchValue>(INITIAL_SEARCH);
  const [appliedSearch, setAppliedSearch] =
    useState<PortalSearchValue>(INITIAL_SEARCH);
  const [searchSeq, setSearchSeq] = useState(0);

  // 업무분류 선택지는 조회 결과와 무관하게 분류 목록 API 에서 가져온다
  const categoriesQuery = useQuery({
    queryKey: ['haccp-base-categories', tenantCode],
    queryFn: () => listHaccpBaseCategories({ tenantCode }),
    retry: false,
  });

  const documentsQuery = useQuery({
    queryKey: ['haccp-portal-documents', tenantCode, userId, appliedSearch, searchSeq],
    queryFn: () =>
      listHaccpPortalDocuments({
        tenantCode,
        categoryId: appliedSearch.category === 'ALL' ? undefined : appliedSearch.category,
        cycle: appliedSearch.cycle === 'ALL' ? undefined : appliedSearch.cycle,
        keyword: appliedSearch.keyword.trim() || undefined,
      }),
    retry: false,
  });

  const rows = useMemo<PortalRow[]>(
    () =>
      (documentsQuery.data ?? []).map((item) => ({
        ...item,
        categoryName: item.categoryName || '기타문서',
      })),
    [documentsQuery.data],
  );

  const categoryOptions = useMemo(
    () => [
      ...(categoriesQuery.data ?? [])
        .filter((category) => category.active)
        .map((category) => ({ value: category.id, label: category.categoryName })),
      { value: UNCATEGORIZED_CATEGORY, label: '기타문서' },
    ],
    [categoriesQuery.data],
  );

  return {
    documentsQuery,
    search,
    setSearch,
    onSearch: () => {
      setAppliedSearch(search);
      setSearchSeq((n) => n + 1);
    },
    categoryOptions,
    rows,
  };
}
