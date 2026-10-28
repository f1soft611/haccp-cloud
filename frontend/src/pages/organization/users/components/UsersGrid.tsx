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
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { UserItem } from '../../../../services/organization/usersService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';

type UsersGridProps = {
  rows: UserItem[];
  roleNameByCode?: Record<string, string>;
  loading?: boolean;
  onEdit: (user: UserItem) => void;
  onToggle: (user: UserItem) => void;
};

function roleLabel(roleCode: string, roleNameByCode?: Record<string, string>) {
  const normalizedCode = String(roleCode ?? '')
    .trim()
    .toUpperCase();
  const mappedName = roleNameByCode?.[normalizedCode];
  if (mappedName) {
    return mappedName;
  }

  if (normalizedCode === 'PLATFORM_ADMIN') return '플랫폼 관리자';
  if (normalizedCode === 'TENANT_ADMIN') return '업체 관리자';
  return '업체 사용자';
}

export function UsersGrid({
  rows,
  roleNameByCode,
  loading,
  onEdit,
  onToggle,
}: UsersGridProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const actionIconSx = {
    color: isDarkMode ? '#fbbf24' : '#1f4f8f',
    bgcolor: isDarkMode
      ? 'rgba(251, 191, 36, 0.12)'
      : 'rgba(31, 79, 143, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(251, 191, 36, 0.2)'
        : 'rgba(31, 79, 143, 0.16)',
    },
  };

  const dangerIconSx = {
    color: isDarkMode ? '#f87171' : '#c53b3b',
    bgcolor: isDarkMode
      ? 'rgba(248, 113, 113, 0.12)'
      : 'rgba(197, 59, 59, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(248, 113, 113, 0.2)'
        : 'rgba(197, 59, 59, 0.16)',
    },
  };

  const successIconSx = {
    color: isDarkMode ? '#86efac' : '#2e7d32',
    bgcolor: isDarkMode
      ? 'rgba(134, 239, 172, 0.12)'
      : 'rgba(46, 125, 50, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(134, 239, 172, 0.2)'
        : 'rgba(46, 125, 50, 0.16)',
    },
  };

  return (
    <AdminGrid ariaLabel="사용자 목록">
      <TableHead>
        <TableRow>
          <TableCell>이름</TableCell>
          <TableCell>이메일</TableCell>
          <TableCell>부서</TableCell>
          <TableCell width={120}>입사일</TableCell>
          <TableCell width={120}>퇴사일</TableCell>
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
                  <Skeleton variant="text" width="80%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="80%" />
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
                  {/* 기존 -> spacing 1 / 변경 -> HACCP 문서현황 기준 spacing 0.5 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} align="center">
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
                <TableCell>{row.joinDate || '-'}</TableCell>
                <TableCell>{row.retireDate || '-'}</TableCell>
                <TableCell>{roleLabel(row.roleCode, roleNameByCode)}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={row.active ? 'success' : 'default'}
                    label={row.active ? '활성' : '비활성'}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="사용자 수정">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="사용자 수정"
                          onClick={() => onEdit(row)}
                          sx={actionIconSx}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={row.active ? '로그인 차단' : '차단 해제'}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={row.active ? '로그인 차단' : '차단 해제'}
                          onClick={() => onToggle(row)}
                          sx={row.active ? dangerIconSx : successIconSx}
                        >
                          <PowerSettingsNewOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
