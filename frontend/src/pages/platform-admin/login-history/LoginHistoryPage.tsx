import { Alert, Stack } from '@mui/material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLoginHistoryList } from '../../../services/platform-admin/loginHistoryService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import {
  LoginHistorySearchBar,
  type LoginHistorySearchValue,
} from './components/LoginHistorySearchBar';
import { LoginHistoryGrid } from './components/LoginHistoryGrid';

export function LoginHistoryPage() {
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<LoginHistorySearchValue>({
    searchField: 'userId',
    searchKeyword: '',
    filterLoginResult: '',
    filterFactoryCode: '',
    filterStartDt: '',
    filterEndDt: '',
  });

  const [appliedFilters, setAppliedFilters] = useState<LoginHistorySearchValue>(
    {
      searchField: 'userId',
      searchKeyword: '',
      filterLoginResult: '',
      filterFactoryCode: '',
      filterStartDt: '',
      filterEndDt: '',
    },
  );

  const effectiveSearchUserId =
    appliedFilters.searchField === 'userId'
      ? appliedFilters.searchKeyword || undefined
      : undefined;

  const effectiveSearchUserName =
    appliedFilters.searchField === 'userName'
      ? appliedFilters.searchKeyword || undefined
      : undefined;

  const query = useQuery({
    queryKey: [
      'login-history',
      pageIndex,
      pageSize,
      appliedFilters.filterFactoryCode,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.filterLoginResult,
      appliedFilters.filterStartDt,
      appliedFilters.filterEndDt,
    ],
    queryFn: () =>
      getLoginHistoryList({
        pageIndex,
        pageSize,
        factoryCode: appliedFilters.filterFactoryCode || undefined,
        searchUserId: effectiveSearchUserId,
        searchUserName: effectiveSearchUserName,
        searchLoginResult: appliedFilters.filterLoginResult,
        searchStartDt: appliedFilters.filterStartDt || undefined,
        searchEndDt: appliedFilters.filterEndDt || undefined,
      }),
  });

  const handleSearch = () => {
    resetPage();
    setAppliedFilters(searchValue);
  };

  return (
    <Stack spacing={2} data-testid="login-history-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={APP_LABELS.pageTitle.loginHistory}
        description="플랫폼 접속 이력을 조회해 계정 사용 현황과 로그인 실패 내역을 확인합니다."
      />

      <LoginHistorySearchBar
        value={searchValue}
        onChange={setSearchValue}
        onSearch={handleSearch}
      />

      {query.isError ? (
        <Alert severity="error">로그인 이력을 불러오지 못했습니다.</Alert>
      ) : null}

      <LoginHistoryGrid
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={query.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}
