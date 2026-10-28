import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
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
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import {
  APP_LABELS,
  getActiveLabel,
} from '../../../../shared/constants/labels';
import type { PlatformRoleItem } from '../../../../services/platform-admin/platformRoleService';

export function PlatformAuthorityGrid(props: {
  rows: PlatformRoleItem[];
  loading?: boolean;
  onMenuMapping: (role: PlatformRoleItem) => void;
  onEdit: (role: PlatformRoleItem) => void;
  onToggleActive: (role: PlatformRoleItem) => void;
}) {
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
  const {
    rows,
    loading = false,
    onMenuMapping,
    onEdit,
    onToggleActive,
  } = props;

  return (
    <AdminGrid ariaLabel="권한 목록">
      <TableHead>
        <TableRow>
          <TableCell>권한 코드</TableCell>
          <TableCell>권한명</TableCell>
          <TableCell>설명</TableCell>
          <TableCell width={100} align="center">
            상태
          </TableCell>
          <TableCell width={220} align="center">
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`platform-authority-grid-skeleton-${index}`}>
                <TableCell>
                  <Skeleton variant="text" width="52%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="68%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="82%" />
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
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center">
              권한 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>{role.code}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>{role.name || '-'}</span>
                    {role.systemRole ? (
                      <Chip size="small" color="warning" label="시스템" />
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell>{role.description || '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={getActiveLabel(role.active)}
                    size="small"
                    color={role.active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="메뉴 매핑">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="메뉴 매핑"
                          onClick={() => onMenuMapping(role)}
                          sx={actionIconSx}
                        >
                          <LinkOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="권한 수정">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="권한 수정"
                          disabled={role.systemRole}
                          onClick={() => onEdit(role)}
                          sx={actionIconSx}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        role.active
                          ? APP_LABELS.action.deactivate
                          : APP_LABELS.action.activate
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={role.systemRole}
                          aria-label={
                            role.active
                              ? APP_LABELS.action.deactivate
                              : APP_LABELS.action.activate
                          }
                          onClick={() => onToggleActive(role)}
                          sx={role.active ? dangerIconSx : successIconSx}
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
