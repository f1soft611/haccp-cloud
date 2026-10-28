import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import {
  Box,
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
import { Fragment } from 'react';
import { useTheme } from '@mui/material/styles';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';
import type { DepartmentItem } from '../../../../services/organization/departmentsService';

export type DepartmentTreeRow = {
  dept: DepartmentItem;
  children: DepartmentItem[];
};

export function DepartmentTreeGrid(props: {
  rows: DepartmentTreeRow[];
  loading?: boolean;
  // 기존 -> deletePending?: boolean;
  // 변경 -> statusPending?: boolean;
  statusPending?: boolean;
  expandedIds: Set<string>;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onToggleExpand: (id: string) => void;
  onEdit: (dept: DepartmentItem) => void;
  // 기존 -> onDelete: (dept: DepartmentItem) => void;
  // 변경 -> onToggleActive: (dept: DepartmentItem) => void;
  onToggleActive: (dept: DepartmentItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const {
    rows,
    loading = false,
    statusPending = false,
    expandedIds,
    pageIndex,
    pageSize,
    totalCount,
    onToggleExpand,
    onEdit,
    onToggleActive,
    onPageChange,
    onPageSizeChange,
  } = props;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const activeChip = (active: boolean) => (
    <Chip
      label={active ? '사용' : '미사용'}
      size="small"
      color={active ? 'success' : 'default'}
      variant="filled"
    />
  );

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

  // 기존 -> 라이트 색만 인라인, mr 0.25 로 간격 / 변경 -> 다크모드 대응 actionIconSx, Tooltip, 간격은 Stack 에서
  const editBtn = (dept: DepartmentItem) => (
    <Tooltip title="부서 수정">
      <span>
        <IconButton
          size="small"
          aria-label="부서 수정"
          onClick={() => onEdit(dept)}
          sx={actionIconSx}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );

  // 기존 -> deleteBtn: 휴지통 아이콘, 하위 부서 있으면 항상 disabled, 클릭 시 onDelete
  // 변경 -> toggleBtn: 전원 아이콘, 사용↔미사용 토글, 하위 부서 있을 때는 "미사용 전환"만 disabled
  // 기존 -> title 속성, 삼항 sx 인라인, disabled opacity 0.38 / 변경 -> Tooltip, sx 상수 (disabled 는 MUI 기본 처리)
  const toggleBtn = (dept: DepartmentItem) => {
    const blockDeactivate = dept.active && dept.hasChildren;
    const label = blockDeactivate
      ? '하위 부서가 있어 미사용으로 변경할 수 없습니다.'
      : dept.active
        ? '미사용으로 변경'
        : '사용으로 변경';
    return (
      <Tooltip title={label}>
        <span>
          <IconButton
            size="small"
            aria-label={label}
            onClick={() => onToggleActive(dept)}
            disabled={statusPending || blockDeactivate}
            sx={dept.active ? dangerIconSx : successIconSx}
          >
            <PowerSettingsNewOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      <AdminGrid ariaLabel="부서 목록">
        <TableHead>
          <TableRow>
            <TableCell width="40">확장</TableCell>
            <TableCell>부서명</TableCell>
            <TableCell>상위 부서</TableCell>
            <TableCell width="80" align="center">
              순서
            </TableCell>
            <TableCell width="90" align="center">
              사용여부
            </TableCell>
            <TableCell width="100" align="center">
              작업
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`dept-skeleton-${idx}`}>
                <TableCell align="center">
                  <Skeleton variant="circular" width={24} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="40%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="30%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={52} height={22} />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> 72x28 하나 / 변경 -> HACCP 문서현황 기준 32x32 두 개 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                align="center"
                sx={{ py: 4, color: 'text.secondary' }}
              >
                등록된 부서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(({ dept, children }) => (
              <Fragment key={dept.id}>
                {/* 루트 부서 행 */}
                <TableRow
                  sx={{
                    '& .MuiTableCell-root': {
                      backgroundColor: isDarkMode ? '#1e293b' : '#f0f7ff',
                    },
                    '&:hover .MuiTableCell-root': {
                      backgroundColor: isDarkMode ? '#263348' : '#e2efff',
                    },
                  }}
                >
                  <TableCell align="center">
                    {children.length > 0 ? (
                      <IconButton
                        size="small"
                        onClick={() => onToggleExpand(dept.id)}
                        sx={{ color: isDarkMode ? '#fbbf24' : '#1f4f8f' }}
                      >
                        {expandedIds.has(dept.id) ? (
                          <ExpandLessOutlinedIcon fontSize="small" />
                        ) : (
                          <ExpandMoreOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                  <TableCell
                    sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
                  >
                    {dept.parentName ?? '—'}
                  </TableCell>
                  <TableCell align="center">{dept.sortOrder}</TableCell>
                  <TableCell align="center">
                    {activeChip(dept.active)}
                  </TableCell>
                  <TableCell align="center">
                    {/* 기존 -> 버튼 두 개 바로 나열 / 변경 -> Stack spacing 0.5 */}
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {editBtn(dept)}
                      {toggleBtn(dept)}
                    </Stack>
                  </TableCell>
                </TableRow>

                {/* 자식 부서 행 (확장 시) */}
                {expandedIds.has(dept.id) &&
                  children.map((child) => (
                    <TableRow
                      key={child.id}
                      sx={{
                        '& .MuiTableCell-root': {
                          backgroundColor: isDarkMode ? '#0f172a' : '#f8fbff',
                        },
                        '& .MuiTableCell-root:first-of-type': {
                          borderLeft: isDarkMode
                            ? '4px solid #fbbf24'
                            : '4px solid #1f4f8f',
                        },
                        '&:hover .MuiTableCell-root': {
                          backgroundColor: isDarkMode ? '#162032' : '#edf4ff',
                        },
                      }}
                    >
                      <TableCell />
                      <TableCell sx={{ pl: 4 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: isDarkMode ? '#fbbf24' : '#1f4f8f',
                              flexShrink: 0,
                            }}
                          />
                          {child.name}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
                      >
                        {child.parentName ?? dept.name}
                      </TableCell>
                      <TableCell align="center">{child.sortOrder}</TableCell>
                      <TableCell align="center">
                        {activeChip(child.active)}
                      </TableCell>
                      <TableCell align="center">
                        {/* 기존 -> 버튼 두 개 바로 나열 / 변경 -> Stack spacing 0.5 */}
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {editBtn(child)}
                          {toggleBtn(child)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}
