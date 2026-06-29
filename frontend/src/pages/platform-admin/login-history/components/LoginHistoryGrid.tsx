import {
  Box,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';

export type LoginHistoryRow = {
  loginHistoryId: number;
  factoryCode?: string | null;
  userId: string;
  userName?: string | null;
  loginDt?: string | null;
  loginIp?: string | null;
  loginType?: string | null;
  loginResult: string;
  logoutDt?: string | null;
};

export function LoginHistoryGrid(props: {
  rows: LoginHistoryRow[];
  loading?: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const {
    rows,
    loading = false,
    pageIndex,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
  } = props;

  return (
    <>
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
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                조회된 로그인 이력이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => (
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
      <Box>
        <GridPaginationBar
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Box>
    </>
  );
}
