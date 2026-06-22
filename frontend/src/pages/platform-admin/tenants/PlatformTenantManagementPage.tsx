import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { listPlatformTenants } from '../../../services/platform/platformTenantManagementService';

type SearchField = 'tenantCode' | 'companyName' | 'adminName';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE';

export function PlatformTenantManagementPage() {
  const navigate = useNavigate();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchField, setSearchField] = useState<SearchField>('companyName');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [appliedFilter, setAppliedFilter] = useState({
    searchField: 'companyName' as SearchField,
    searchKeyword: '',
    status: 'all' as StatusFilter,
  });

  const tenantQuery = useQuery({
    queryKey: [
      'platform-admin',
      'tenant-management',
      pageIndex,
      pageSize,
      appliedFilter.searchField,
      appliedFilter.searchKeyword,
      appliedFilter.status,
    ],
    queryFn: () =>
      listPlatformTenants({
        pageIndex,
        pageSize,
        searchField: appliedFilter.searchField,
        searchKeyword: appliedFilter.searchKeyword,
        status: appliedFilter.status,
      }),
    retry: false,
  });

  const rows = useMemo(() => tenantQuery.data?.items ?? [], [tenantQuery.data]);

  const handleSearch = () => {
    resetPage();
    setAppliedFilter({
      searchField,
      searchKeyword: searchKeyword.trim(),
      status: statusFilter,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-tenant-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={APP_LABELS.menu.platformFactoryManagement}
        description="업체 운영 현황을 조회하고 신규 온보딩으로 연결합니다."
      />

      {tenantQuery.isError ? (
        <Alert severity="warning">업체 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="flex-end"
        >
          <Box sx={{ minWidth: 130 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              검색 조건
            </Typography>
            <Select
              value={searchField}
              size="small"
              fullWidth
              onChange={(event) =>
                setSearchField(event.target.value as SearchField)
              }
            >
              <MenuItem value="tenantCode">업체코드</MenuItem>
              <MenuItem value="companyName">업체명</MenuItem>
              <MenuItem value="adminName">관리자명</MenuItem>
            </Select>
          </Box>

          <TextField
            size="small"
            label="검색어"
            fullWidth
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            sx={{ flex: 1 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />

          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              상태
            </Typography>
            <Select
              value={statusFilter}
              size="small"
              fullWidth
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="ACTIVE">활성</MenuItem>
              <MenuItem value="INACTIVE">비활성</MenuItem>
            </Select>
          </Box>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={tenantQuery.isPending}
          >
            조회
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate('/platform/onboarding')}
            sx={{ ml: { md: 'auto' } }}
          >
            신규 온보딩
          </Button>
        </Stack>
      </Paper>

      <AdminGrid ariaLabel="업체 목록">
        <TableHead>
          <TableRow>
            <TableCell>업체코드</TableCell>
            <TableCell>업체명</TableCell>
            <TableCell>관리자명</TableCell>
            <TableCell>관리자이메일</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>생성일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenantQuery.isPending
            ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={`platform-tenant-grid-skeleton-${index}`}
                  data-testid={`platform-tenant-grid-skeleton-row-${index}`}
                >
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="72%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="68%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="88%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={52}
                      height={24}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="65%" />
                  </TableCell>
                </TableRow>
              ))
            : null}

          {!tenantQuery.isPending && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                조회 결과가 없습니다.
              </TableCell>
            </TableRow>
          ) : null}

          {!tenantQuery.isPending
            ? rows.map((row) => (
                <TableRow key={row.tenantCode} hover>
                  <TableCell>{row.tenantCode}</TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>{row.adminName}</TableCell>
                  <TableCell>{row.adminEmail}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status === 'ACTIVE' ? '활성' : '비활성'}
                      size="small"
                      color={row.status === 'ACTIVE' ? 'success' : 'default'}
                      variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    {row.createdAt ? row.createdAt.slice(0, 10) : '-'}
                  </TableCell>
                </TableRow>
              ))
            : null}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={tenantQuery.data?.total ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}
