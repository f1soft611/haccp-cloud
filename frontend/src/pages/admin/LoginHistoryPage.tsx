import {
  Alert,
  Box,
  Button,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLoginHistoryList } from '../../services/auth/loginHistoryService';
import { APP_LABELS } from '../../shared/constants/labels';
import { AdminGrid } from '../../shared/components/data/AdminGrid';
import { PageHeader } from '../../shared/components/layout/PageHeader';

const PAGE_SIZE = 10;
type SearchField = 'userId' | 'userName';

export function LoginHistoryPage() {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchField, setSearchField] = useState<SearchField>('userId');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLoginResult, setFilterLoginResult] = useState<'Y' | 'N' | ''>(
    '',
  );
  const [filterFactoryCode, setFilterFactoryCode] = useState('');
  const [filterStartDt, setFilterStartDt] = useState('');
  const [filterEndDt, setFilterEndDt] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    factoryCode: '',
    searchField: 'userId' as SearchField,
    searchKeyword: '',
    searchLoginResult: '' as 'Y' | 'N' | '',
    searchStartDt: '',
    searchEndDt: '',
  });

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
      appliedFilters.factoryCode,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.searchLoginResult,
      appliedFilters.searchStartDt,
      appliedFilters.searchEndDt,
    ],
    queryFn: () =>
      getLoginHistoryList({
        pageIndex,
        pageSize: PAGE_SIZE,
        factoryCode: appliedFilters.factoryCode || undefined,
        searchUserId: effectiveSearchUserId,
        searchUserName: effectiveSearchUserName,
        searchLoginResult: appliedFilters.searchLoginResult,
        searchStartDt: appliedFilters.searchStartDt || undefined,
        searchEndDt: appliedFilters.searchEndDt || undefined,
      }),
  });

  const totalPages = useMemo(() => {
    if (!query.data?.totalCount) {
      return 1;
    }

    return Math.max(1, Math.ceil(query.data.totalCount / PAGE_SIZE));
  }, [query.data?.totalCount]);

  const handleSearch = () => {
    setPageIndex(1);
    setAppliedFilters({
      factoryCode: filterFactoryCode.trim(),
      searchField,
      searchKeyword: searchKeyword.trim(),
      searchLoginResult: filterLoginResult,
      searchStartDt: filterStartDt,
      searchEndDt: filterEndDt,
    });
  };

  return (
    <Stack spacing={2} data-testid="login-history-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={APP_LABELS.pageTitle.loginHistory}
        description="플랫폼 접속 이력을 조회해 계정 사용 현황과 로그인 실패 내역을 확인합니다."
      />

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="flex-end"
        >
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              검색 조건
            </Typography>
            <Select
              value={searchField}
              onChange={(event) =>
                setSearchField(event.target.value as SearchField)
              }
              size="small"
              fullWidth
            >
              <MenuItem value="userId">사용자 ID</MenuItem>
              <MenuItem value="userName">사용자명</MenuItem>
            </Select>
          </Box>

          <TextField
            label="검색어"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 180 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />

          <TextField
            select
            label="로그인 결과"
            value={filterLoginResult}
            onChange={(event) =>
              setFilterLoginResult(event.target.value as 'Y' | 'N' | '')
            }
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">성공</MenuItem>
            <MenuItem value="N">실패</MenuItem>
          </TextField>

          <TextField
            label="업체코드"
            value={filterFactoryCode}
            onChange={(event) => setFilterFactoryCode(event.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />

          <TextField
            label="시작일"
            type="date"
            size="small"
            value={filterStartDt}
            onChange={(event) => setFilterStartDt(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <TextField
            label="종료일"
            type="date"
            size="small"
            value={filterEndDt}
            onChange={(event) => setFilterEndDt(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <Button variant="contained" onClick={handleSearch}>
            조회
          </Button>
        </Stack>
      </Paper>

      {query.isError ? (
        <Alert severity="error">로그인 이력을 불러오지 못했습니다.</Alert>
      ) : null}

      <AdminGrid ariaLabel="로그인 이력 목록">
        <TableHead>
          <TableRow>
            <TableCell width={90}>이력 ID</TableCell>
            <TableCell width={110}>업체코드</TableCell>
            <TableCell width={140}>사용자 ID</TableCell>
            <TableCell width={120}>사용자명</TableCell>
            <TableCell width={170}>로그인 일시</TableCell>
            <TableCell width={140}>로그인 IP</TableCell>
            <TableCell width={120}>로그인 유형</TableCell>
            <TableCell width={90}>결과</TableCell>
            <TableCell width={170}>로그아웃 일시</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(query.data?.items ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                조회된 로그인 이력이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            (query.data?.items ?? []).map((item) => (
              <TableRow key={item.loginHistoryId}>
                <TableCell>{item.loginHistoryId}</TableCell>
                <TableCell>{item.factoryCode || '-'}</TableCell>
                <TableCell>{item.userId}</TableCell>
                <TableCell>{item.userName || '-'}</TableCell>
                <TableCell>{item.loginDt || '-'}</TableCell>
                <TableCell>{item.loginIp || '-'}</TableCell>
                <TableCell>{item.loginType || '-'}</TableCell>
                <TableCell>
                  {item.loginResult === 'Y' ? '성공' : '실패'}
                </TableCell>
                <TableCell>{item.logoutDt || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          page={pageIndex}
          count={totalPages}
          onChange={(_, value) => setPageIndex(value)}
          shape="rounded"
          color="primary"
        />
      </Box>
    </Stack>
  );
}
