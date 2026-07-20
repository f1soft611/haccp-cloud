import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listHaccpBaseCategories } from '../../../../services/documents/haccpBaseCategoryService';
import { listHaccpDocuments } from '../../../../services/documents/haccpDocumentService';
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
  return {
    workType: searchParams.get('workType') || '전체',
    draftNumber: searchParams.get('draftNumber') || '',
    title: searchParams.get('title') || '',
    writer: searchParams.get('writer') || '',
    status: searchParams.get('status') || '전체',
    startDate: searchParams.get('startDate') || monthRange.startDate,
    endDate: searchParams.get('endDate') || monthRange.endDate,
  };
}

function isDocumentViewerAdmin(role: string): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN';
}

export function useHaccpDocumentManagement() {
  const role = useAuthStore((state) => state.role);
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const canViewAllDocuments = isDocumentViewerAdmin(role);

  const [searchParams] = useSearchParams();
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

  const documentsQuery = useQuery({
    queryKey: ['haccp-documents', tenantCode, role, appliedFilters],
    queryFn: () =>
      listHaccpDocuments({
        tenantCode,
        workType:
          appliedFilters.workType.trim() && appliedFilters.workType !== '전체'
            ? appliedFilters.workType.trim()
            : undefined,
        draftNumber: appliedFilters.draftNumber.trim() || undefined,
        title: appliedFilters.title.trim() || undefined,
        writer: canViewAllDocuments
          ? appliedFilters.writer.trim() || undefined
          : undefined,
        status:
          appliedFilters.status.trim() && appliedFilters.status !== '전체'
            ? appliedFilters.status.trim()
            : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      }),
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ['haccp-base-categories', tenantCode],
    queryFn: () => listHaccpBaseCategories({ tenantCode }),
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
    if (appliedFilters.title.trim()) {
      chips.push({
        key: 'title',
        label: `제목: ${appliedFilters.title.trim()}`,
      });
    }
    if (appliedFilters.status && appliedFilters.status !== '전체') {
      chips.push({ key: 'status', label: `상태: ${appliedFilters.status}` });
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
  }, [appliedFilters, canViewAllDocuments]);

  const handleReset = () => {
    const monthRange = getCurrentMonthRange();
    const resetValue: HaccpDocSearchValue = {
      workType: '전체',
      draftNumber: '',
      title: '',
      writer: '',
      status: '전체',
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
    };
    setSearchValue(resetValue);
    setAppliedFilters(resetValue);
  };

  const handleSearch = () => {
    setAppliedFilters({ ...searchValue });
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
    documentsQuery,
    rows: documentsQuery.data ?? [],
    handleReset,
    handleSearch,
  };
}
