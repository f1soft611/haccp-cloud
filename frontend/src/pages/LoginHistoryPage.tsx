import {
  Alert,
  Box,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLoginHistoryList } from '../services/loginHistoryService';

const PAGE_SIZE = 10;

export function LoginHistoryPage() {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchLoginResult, setSearchLoginResult] = useState<'Y' | 'N' | ''>(
    '',
  );

  const query = useQuery({
    queryKey: ['login-history', pageIndex, searchUserId, searchLoginResult],
    queryFn: () =>
      getLoginHistoryList({
        pageIndex,
        pageSize: PAGE_SIZE,
        searchUserId: searchUserId || undefined,
        searchLoginResult,
      }),
  });

  const totalPages = useMemo(() => {
    if (!query.data?.totalCount) {
      return 1;
    }

    return Math.max(1, Math.ceil(query.data.totalCount / PAGE_SIZE));
  }, [query.data?.totalCount]);

  return (
    <Stack spacing={2} data-testid="login-history-page">
      <Typography variant="h4">로그인 이력</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            label="사용자 ID"
            value={searchUserId}
            onChange={(event) => {
              setSearchUserId(event.target.value);
              setPageIndex(1);
            }}
            size="small"
          />
          <TextField
            select
            label="로그인 결과"
            value={searchLoginResult}
            onChange={(event) => {
              setSearchLoginResult(event.target.value as 'Y' | 'N' | '');
              setPageIndex(1);
            }}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">성공</MenuItem>
            <MenuItem value="N">실패</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {query.isError ? (
        <Alert severity="error">로그인 이력을 불러오지 못했습니다.</Alert>
      ) : null}

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>사용자</TableCell>
              <TableCell>로그인 일시</TableCell>
              <TableCell>로그인 IP</TableCell>
              <TableCell>유형</TableCell>
              <TableCell>결과</TableCell>
              <TableCell>로그아웃 일시</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(query.data?.items ?? []).map((item) => (
              <TableRow key={item.loginHistoryId}>
                <TableCell>{item.loginHistoryId}</TableCell>
                <TableCell>{item.userId}</TableCell>
                <TableCell>{item.loginDt || '-'}</TableCell>
                <TableCell>{item.loginIp || '-'}</TableCell>
                <TableCell>{item.loginType || '-'}</TableCell>
                <TableCell>
                  {item.loginResult === 'Y' ? '성공' : '실패'}
                </TableCell>
                <TableCell>{item.logoutDt || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

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
