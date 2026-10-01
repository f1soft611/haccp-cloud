import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import {
  Box,
  Chip,
  IconButton,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

  const editBtn = (dept: DepartmentItem) => (
    <IconButton
      size="small"
      onClick={() => onEdit(dept)}
      sx={{
        mr: 0.25,
        color: '#1f4f8f',
        bgcolor: 'rgba(31, 79, 143, 0.08)',
        '&:hover': { bgcolor: 'rgba(31, 79, 143, 0.16)' },
      }}
    >
      <EditOutlinedIcon fontSize="small" />
    </IconButton>
  );

  // 기존 -> deleteBtn: 휴지통 아이콘, 하위 부서 있으면 항상 disabled, 클릭 시 onDelete
  // 변경 -> toggleBtn: 전원 아이콘, 사용↔미사용 토글, 하위 부서 있을 때는 "미사용 전환"만 disabled
  const toggleBtn = (dept: DepartmentItem) => {
    const blockDeactivate = dept.active && dept.hasChildren;
    return (
        <IconButton
            size="small"
            onClick={() => onToggleActive(dept)}
            disabled={statusPending || blockDeactivate}
            title={
              blockDeactivate
                  ? '하위 부서가 있어 미사용으로 변경할 수 없습니다.'
                  : dept.active
                      ? '미사용으로 변경'
                      : '사용으로 변경'
            }
            sx={{
              color: dept.active
                  ? isDarkMode
                      ? '#f87171'
                      : '#c53b3b'
                  : isDarkMode
                      ? '#86efac'
                      : '#2e7d32',
              bgcolor: dept.active
                  ? isDarkMode
                      ? 'rgba(248, 113, 113, 0.12)'
                      : 'rgba(197, 59, 59, 0.08)'
                  : isDarkMode
                      ? 'rgba(134, 239, 172, 0.12)'
                      : 'rgba(46, 125, 50, 0.08)',
              '&:hover': {
                bgcolor: dept.active
                    ? isDarkMode
                        ? 'rgba(248, 113, 113, 0.2)'
                        : 'rgba(197, 59, 59, 0.16)'
                    : isDarkMode
                        ? 'rgba(134, 239, 172, 0.2)'
                        : 'rgba(46, 125, 50, 0.16)',
              },
              '&.Mui-disabled': { opacity: 0.38 },
            }}
        >
          <PowerSettingsNewOutlinedIcon fontSize="small" />
        </IconButton>
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
                  <Skeleton variant="rounded" width={72} height={28} />
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
                    {editBtn(dept)}
                    {toggleBtn(dept)}
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
                        {editBtn(child)}
                        {toggleBtn(child)}
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
