import { Alert, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { listPlatformTenants } from '../../../services/platform-admin/tenants/platformTenantManagementService';
import { PlatformTenantSearchBar } from './components/PlatformTenantSearchBar';
import { PlatformTenantGrid } from './components/PlatformTenantGrid';
import { type PlatformTenantSearchValue } from './types';

const DEFAULT_SEARCH_VALUE: PlatformTenantSearchValue = {
  searchField: 'companyName',
  searchKeyword: '',
  status: 'all',
  onboardingStatus: 'all',
};

export function PlatformTenantManagementPage() {
  const navigate = useNavigate();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] =
    useState<PlatformTenantSearchValue>(DEFAULT_SEARCH_VALUE);
  const [appliedFilter, setAppliedFilter] =
    useState<PlatformTenantSearchValue>(DEFAULT_SEARCH_VALUE);

  const tenantQuery = useQuery({
    queryKey: [
      'platform-admin',
      'tenant-management',
      pageIndex,
      pageSize,
      appliedFilter.searchField,
      appliedFilter.searchKeyword,
      appliedFilter.status,
      appliedFilter.onboardingStatus,
    ],
    queryFn: () =>
      listPlatformTenants({
        pageIndex,
        pageSize,
        searchField: appliedFilter.searchField,
        searchKeyword: appliedFilter.searchKeyword,
        status: appliedFilter.status,
        onboardingStatus: appliedFilter.onboardingStatus,
      }),
    retry: false,
  });

  const rows = useMemo(() => tenantQuery.data?.items ?? [], [tenantQuery.data]);

  const handleSearch = () => {
    resetPage();
    setAppliedFilter({
      ...searchValue,
      searchKeyword: searchValue.searchKeyword.trim(),
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-tenant-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.menu.platformFactoryManagement}
        description="업체 운영 현황을 조회하고 신규 온보딩으로 연결합니다."
      />

      {tenantQuery.isError ? (
        <Alert severity="warning">업체 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <PlatformTenantSearchBar
        value={searchValue}
        disabled={tenantQuery.isPending}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onClickOnboarding={() => navigate('/platform/onboarding')}
      />

      <PlatformTenantGrid
        rows={rows}
        loading={tenantQuery.isPending}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={tenantQuery.data?.total ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}
