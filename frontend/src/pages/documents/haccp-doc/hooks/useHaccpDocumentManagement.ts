import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listHaccpBaseCategories } from '../../../../services/documents/haccpBaseCategoryService';
import { listHaccpBaseWorks } from '../../../../services/documents/haccpBaseWorkService';
import { listHaccpDocuments } from '../../../../services/documents/haccpDocumentService';
import { useGridPagination } from '../../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { HaccpDocSearchValue } from '../types';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange(today: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: formatDate(today),
  };
}

// URL 에서 읽은 필터 값을 정리한다. 예전 URL 의 '전체'는 조건 없음('')으로 본다
function readFilterParam(searchParams: URLSearchParams, key: string) {
  const raw = (searchParams.get(key) || '').trim();
  return raw === '전체' ? '' : raw;
}

function toSearchValue(searchParams: URLSearchParams): HaccpDocSearchValue {
  const monthRange = getCurrentMonthRange();
  const participantTypeValues = searchParams.getAll('participantType');
  const participantTypes =
    participantTypeValues.length > 0
      ? participantTypeValues
          .flatMap((value) => value.split(','))
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : [];

  return {
    workType: readFilterParam(searchParams, 'workType'),
    workDivision:
      searchParams.get('workDivisionId') ||
      searchParams.get('workDivision') ||
      '',
    title: searchParams.get('title') || '',
    participantType: participantTypes,
    status: readFilterParam(searchParams, 'status'),
    startDate: searchParams.has('startDate')
      ? (searchParams.get('startDate') ?? '')
      : monthRange.startDate,
    endDate: searchParams.has('endDate')
      ? (searchParams.get('endDate') ?? '')
      : monthRange.endDate,
  };
}

function toSearchParams(
  value: HaccpDocSearchValue,
  options: {
    canViewAllDocuments: boolean;
    divisionOptions: Array<{ id: string; name: string }>;
  },
): URLSearchParams {
  const params = new URLSearchParams();
  const trimmedWorkType = value.workType.trim();
  const trimmedWorkDivision = value.workDivision.trim();
  const trimmedTitle = value.title.trim();
  const trimmedStatus = value.status.trim();
  const hasKnownDivisionId = options.divisionOptions.some(
    (option) => option.id === trimmedWorkDivision,
  );

  // 기존 -> trimmedWorkType && trimmedWorkType !== '전체' / 변경 -> '' = 전체
  if (trimmedWorkType) {
    params.set('workType', trimmedWorkType);
  }

  if (trimmedWorkDivision) {
    if (hasKnownDivisionId) {
      params.set('workDivisionId', trimmedWorkDivision);
    } else {
      params.set('workDivision', trimmedWorkDivision);
    }
  }

  if (trimmedTitle) {
    params.set('title', trimmedTitle);
  }

  if (value.participantType.length > 0) {
    params.set('participantType', value.participantType.join(','));
  }

  if (trimmedStatus) {
    params.set('status', trimmedStatus);
  }

  params.set('startDate', value.startDate);
  params.set('endDate', value.endDate);

  return params;
}

function isDocumentViewerAdmin(role: string): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN';
}

// 문서현황 페이지의 검색 조건, 목록 조회 상태를 관리
export function useHaccpDocumentManagement() {
  const role = useAuthStore((state) => state.role);
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const canViewAllDocuments = isDocumentViewerAdmin(role);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDivisionId = (searchParams.get('workDivisionId') || '').trim();
  const initialValue = useMemo(
    () => toSearchValue(searchParams),
    [searchParams],
  );

  const [searchValue, setSearchValue] = useState<HaccpDocSearchValue>(initialValue);
  const [appliedFilters, setAppliedFilters] = useState<HaccpDocSearchValue>(initialValue);
  const [searchSeq, setSearchSeq] = useState(0);

  const categoriesQuery = useQuery({
    queryKey: ['haccp-base-categories', tenantCode],
    queryFn: () => listHaccpBaseCategories({ tenantCode }),
    retry: false,
  });

  const baseWorksQuery = useQuery({
    queryKey: ['haccp-base-works', tenantCode, 'document-search-panel'],
    queryFn: () => listHaccpBaseWorks({ tenantCode, active: 'Y' }),
    retry: false,
  });

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .filter((item) => item.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({ id: item.id, name: item.categoryName })),
    [categoriesQuery.data],
  );

  const divisionOptions = useMemo(() => {
    const selectedWorkType = searchValue.workType.trim();
    const onlySpecificType = selectedWorkType.length > 0;

    const activeWorks = (baseWorksQuery.data ?? []).filter((item) => {
      if (!item.active) {
        return false;
      }

      return true;
    });

    const filteredWorks = onlySpecificType
      ? activeWorks.filter(
          (item) => item.categoryName.trim() === selectedWorkType,
        )
      : activeWorks;

    const source = filteredWorks.length > 0 ? filteredWorks : activeWorks;

    const seen = new Set<string>();
    const options: Array<{ id: string; name: string }> = [];

    source.forEach((item) => {
      const id = item.id.trim();
      const name = item.divisionName.trim();
      if (!id || !name || seen.has(id)) {
        return;
      }
      seen.add(id);
      options.push({ id, name });
    });

    return options.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [baseWorksQuery.data, searchValue.workType]);

  useEffect(() => {
    const current = searchValue.workDivision.trim();
    if (!current) {
      return;
    }

    if (divisionOptions.some((option) => option.id === current)) {
      return;
    }

    const matchedByName = divisionOptions.find(
      (option) => option.name === current,
    );
    if (!matchedByName) {
      return;
    }

    setSearchValue((prev) => ({
      ...prev,
      workDivision: matchedByName.id,
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      workDivision: matchedByName.id,
    }));
  }, [divisionOptions, searchValue.workDivision]);

  const documentsQuery = useQuery({
    queryKey: [
      'haccp-documents',
      tenantCode,
      role,
      pageIndex,
      pageSize,
      appliedFilters,
      searchSeq,
    ],
    queryFn: () => {
      // 미작성은 업무개시일부터 전체 주기를 보므로 기안일 조건을 보내지 않음
      const isUnwritten = appliedFilters.status === '미작성';
      const divisionValue = appliedFilters.workDivision.trim();
      const isKnownDivisionId = divisionOptions.some(
        (option) => option.id === divisionValue,
      );
      const isRequestedDivisionId =
        requestedDivisionId.length > 0 && divisionValue === requestedDivisionId;

      return listHaccpDocuments({
        tenantCode,
        pageIndex,
        pageSize,
        workType: appliedFilters.workType.trim() || undefined,
        workDivisionId:
          isKnownDivisionId || isRequestedDivisionId
            ? divisionValue
            : undefined,
        workDivision:
          isKnownDivisionId || isRequestedDivisionId
            ? undefined
            : divisionValue || undefined,
        title: appliedFilters.title.trim() || undefined,
        participantType:
          appliedFilters.participantType.length > 0
            ? appliedFilters.participantType.join(',')
            : undefined,
        status: appliedFilters.status.trim() || undefined,
        startDate: isUnwritten ? undefined : appliedFilters.startDate || undefined,
        endDate: isUnwritten ? undefined : appliedFilters.endDate || undefined,
      });
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const handleReset = () => {
    const monthRange = getCurrentMonthRange();
    const resetValue: HaccpDocSearchValue = {
      workType: '',
      workDivision: '',
      title: '',
      participantType: [],
      status: '',
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
    };
    setSearchValue(resetValue);
    setAppliedFilters(resetValue);
    resetPage();
    setSearchParams(
      toSearchParams(resetValue, {
        canViewAllDocuments,
        divisionOptions,
      }),
    );
  };

  const handleSearch = () => {
    resetPage();
    const nextFilters = { ...searchValue };
    setAppliedFilters(nextFilters);
    setSearchParams(
      toSearchParams(nextFilters, {
        canViewAllDocuments,
        divisionOptions,
      }),
    );
    setSearchSeq((n) => n + 1);
  };

  return {
    canViewAllDocuments,
    searchValue,
    setSearchValue,
    appliedFilters,
    categoryOptions,
    divisionOptions,
    documentsQuery,
    rows: documentsQuery.data?.items ?? [],
    totalCount: documentsQuery.data?.totalCount ?? 0,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    handleReset,
    handleSearch,
  };
}
