import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listHaccpBaseCategories } from '../../../../services/documents/haccpBaseCategoryService';
import { listHaccpBaseWorks } from '../../../../services/documents/haccpBaseWorkService';
import { listHaccpDocuments } from '../../../../services/documents/haccpDocumentService';
import { useGridPagination } from '../../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { HaccpDocFilterChip, HaccpDocSearchValue } from '../types';

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
    workType: searchParams.get('workType') || '전체',
    workDivision:
      searchParams.get('workDivisionId') ||
      searchParams.get('workDivision') ||
      '',
    draftNumber: searchParams.get('draftNumber') || '',
    title: searchParams.get('title') || '',
    writer: searchParams.get('writer') || '',
    participantType: participantTypes,
    status: searchParams.get('status') || '전체',
    startDate: searchParams.get('startDate') || monthRange.startDate,
    endDate: searchParams.get('endDate') || monthRange.endDate,
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
  const trimmedDraftNumber = value.draftNumber.trim();
  const trimmedTitle = value.title.trim();
  const trimmedWriter = value.writer.trim();
  const trimmedStatus = value.status.trim();
  const hasKnownDivisionId = options.divisionOptions.some(
    (option) => option.id === trimmedWorkDivision,
  );

  if (trimmedWorkType && trimmedWorkType !== '전체') {
    params.set('workType', trimmedWorkType);
  }

  if (trimmedWorkDivision) {
    if (hasKnownDivisionId) {
      params.set('workDivisionId', trimmedWorkDivision);
    } else {
      params.set('workDivision', trimmedWorkDivision);
    }
  }

  if (trimmedDraftNumber) {
    params.set('draftNumber', trimmedDraftNumber);
  }

  if (trimmedTitle) {
    params.set('title', trimmedTitle);
  }

  if (options.canViewAllDocuments && trimmedWriter) {
    params.set('writer', trimmedWriter);
  }

  if (value.participantType.length > 0) {
    params.set('participantType', value.participantType.join(','));
  }

  if (trimmedStatus && trimmedStatus !== '전체') {
    params.set('status', trimmedStatus);
  }

  if (value.startDate) {
    params.set('startDate', value.startDate);
  }

  if (value.endDate) {
    params.set('endDate', value.endDate);
  }

  return params;
}

function isDocumentViewerAdmin(role: string): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN';
}

export function useHaccpDocumentManagement() {
  const role = useAuthStore((state) => state.role);
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const canViewAllDocuments = isDocumentViewerAdmin(role);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDivisionId = (searchParams.get('workDivisionId') || '').trim();
  const initialValue = useMemo(() => {
    const value = toSearchValue(searchParams);

    if (canViewAllDocuments) {
      return value;
    }

    return {
      ...value,
      writer: '',
    };
  }, [canViewAllDocuments, searchParams]);

  const [searchValue, setSearchValue] =
    useState<HaccpDocSearchValue>(initialValue);
  const [appliedFilters, setAppliedFilters] =
    useState<HaccpDocSearchValue>(initialValue);
  const [detailOpen, setDetailOpen] = useState(false);

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
    const onlySpecificType =
      selectedWorkType.length > 0 && selectedWorkType !== '전체';

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
    ],
    queryFn: () => {
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
        workType:
          appliedFilters.workType.trim() && appliedFilters.workType !== '전체'
            ? appliedFilters.workType.trim()
            : undefined,
        workDivisionId:
          isKnownDivisionId || isRequestedDivisionId
            ? divisionValue
            : undefined,
        workDivision:
          isKnownDivisionId || isRequestedDivisionId
            ? undefined
            : divisionValue || undefined,
        draftNumber: appliedFilters.draftNumber.trim() || undefined,
        title: appliedFilters.title.trim() || undefined,
        writer: canViewAllDocuments
          ? appliedFilters.writer.trim() || undefined
          : undefined,
        participantType:
          appliedFilters.participantType.length > 0
            ? appliedFilters.participantType.join(',')
            : undefined,
        status:
          appliedFilters.status.trim() && appliedFilters.status !== '전체'
            ? appliedFilters.status.trim()
            : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const activeFilterChips = useMemo<HaccpDocFilterChip[]>(() => {
    const chips: HaccpDocFilterChip[] = [];

    chips.push({
      key: 'dateRange',
      label: `기간: ${appliedFilters.startDate || '-'} ~ ${appliedFilters.endDate || '-'}`,
    });

    if (appliedFilters.workType && appliedFilters.workType !== '전체') {
      chips.push({
        key: 'workType',
        label: `업무분류: ${appliedFilters.workType}`,
      });
    }
    if (appliedFilters.workDivision.trim()) {
      const selectedDivisionName =
        divisionOptions.find(
          (option) => option.id === appliedFilters.workDivision.trim(),
        )?.name ?? appliedFilters.workDivision.trim();
      chips.push({
        key: 'workDivision',
        label: `업무구분: ${selectedDivisionName}`,
      });
    }
    if (appliedFilters.title.trim()) {
      chips.push({
        key: 'title',
        label: `제목: ${appliedFilters.title.trim()}`,
      });
    }
    if (appliedFilters.status && appliedFilters.status !== '전체') {
      chips.push({ key: 'status', label: `상태: ${appliedFilters.status}` });
    }
    if (appliedFilters.participantType.length > 0) {
      chips.push({
        key: 'participantType',
        label: `참여유형: ${appliedFilters.participantType.join(', ')}`,
      });
    }
    if (appliedFilters.draftNumber.trim()) {
      chips.push({
        key: 'draftNumber',
        label: `기안번호: ${appliedFilters.draftNumber.trim()}`,
      });
    }
    if (canViewAllDocuments && appliedFilters.writer.trim()) {
      chips.push({
        key: 'writer',
        label: `작성자: ${appliedFilters.writer.trim()}`,
      });
    }
    return chips;
  }, [appliedFilters, canViewAllDocuments, divisionOptions]);

  const handleReset = () => {
    const monthRange = getCurrentMonthRange();
    const resetValue: HaccpDocSearchValue = {
      workType: '전체',
      workDivision: '',
      draftNumber: '',
      title: '',
      writer: '',
      participantType: [],
      status: '전체',
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
  };

  return {
    canViewAllDocuments,
    searchValue,
    setSearchValue,
    appliedFilters,
    detailOpen,
    setDetailOpen,
    activeFilterChips,
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
