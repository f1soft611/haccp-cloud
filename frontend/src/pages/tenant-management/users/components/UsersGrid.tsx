import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import {
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { UserItem } from '../../../../services/common/usersService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';

type UsersGridProps = {
  rows: UserItem[];
  loading?: boolean;
  onEdit: (user: UserItem) => void;
  onToggle: (user: UserItem) => void;
};

function roleLabel(roleCode: string) {
  if (roleCode === 'PLATFORM_ADMIN') return '플랫폼관리자';
  if (roleCode === 'TENANT_ADMIN') return '업체관리자';
  return '일반사용자';
}

export function UsersGrid({ rows, loading, onEdit, onToggle }: UsersGridProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <AdminGrid ariaLabel="사용자 목록">
      <TableHead>
        <TableRow>
          <TableCell>이름</TableCell>
          <TableCell>이메일</TableCell>
          <TableCell>부서</TableCell>
          <TableCell>권한</TableCell>
          <TableCell width={100} align="center">
            상태
          </TableCell>
          <TableCell width={160} align="center">
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`users-grid-skeleton-${index}`}>
                <TableCell>
                  <Skeleton variant="text" width="58%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="78%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="52%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} align="center">
              조회된 사용자가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.department || '-'}</TableCell>
                <TableCell>{roleLabel(row.roleCode)}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={row.active ? 'success' : 'default'}
                    label={row.active ? '활성' : '비활성'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      aria-label="사용자 수정"
                      onClick={() => onEdit(row)}
                      sx={{
                        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                        bgcolor: isDarkMode
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(31, 79, 143, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(31, 79, 143, 0.16)',
                        },
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={row.active ? '로그인 차단' : '차단 해제'}
                      onClick={() => onToggle(row)}
                      sx={{
                        color: row.active
                          ? isDarkMode
                            ? '#f87171'
                            : '#c53b3b'
                          : isDarkMode
                            ? '#86efac'
                            : '#2e7d32',
                        bgcolor: row.active
                          ? isDarkMode
                            ? 'rgba(248, 113, 113, 0.12)'
                            : 'rgba(197, 59, 59, 0.08)'
                          : isDarkMode
                            ? 'rgba(134, 239, 172, 0.12)'
                            : 'rgba(46, 125, 50, 0.08)',
                        '&:hover': {
                          bgcolor: row.active
                            ? isDarkMode
                              ? 'rgba(248, 113, 113, 0.2)'
                              : 'rgba(197, 59, 59, 0.16)'
                            : isDarkMode
                              ? 'rgba(134, 239, 172, 0.2)'
                              : 'rgba(46, 125, 50, 0.16)',
                        },
                      }}
                    >
                      <PowerSettingsNewOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
