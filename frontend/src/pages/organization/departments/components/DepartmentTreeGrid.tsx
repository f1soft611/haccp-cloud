import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
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
  deletePending?: boolean;
  expandedIds: Set<string>;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onToggleExpand: (id: string) => void;
  onEdit: (dept: DepartmentItem) => void;
  onDelete: (dept: DepartmentItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const {
    rows,
    loading = false,
    deletePending = false,
    expandedIds,
    pageIndex,
    pageSize,
    totalCount,
    onToggleExpand,
    onEdit,
    onDelete,
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

  const deleteBtn = (dept: DepartmentItem) => (
    <IconButton
      size="small"
      onClick={() => onDelete(dept)}
      disabled={deletePending || dept.hasChildren}
      title={dept.hasChildren ? '하위 부서가 있어 삭제할 수 없습니다.' : '삭제'}
      sx={{
        color: '#c53b3b',
        bgcolor: 'rgba(197, 59, 59, 0.08)',
        '&:hover': { bgcolor: 'rgba(197, 59, 59, 0.16)' },
        '&.Mui-disabled': { opacity: 0.38 },
      }}
    >
      <DeleteOutlineOutlinedIcon fontSize="small" />
    </IconButton>
  );

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
                    {deleteBtn(dept)}
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
                        {deleteBtn(child)}
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
