import { ChevronDown, ChevronUp, Power } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Box,
  Chip,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { Fragment } from 'react';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';
import type { DepartmentItem } from '../../../../services/organization/departmentsService';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

export type DepartmentTreeRow = {
  dept: DepartmentItem;
  children: DepartmentItem[];
};

export function DepartmentTreeGrid(props: {
  rows: DepartmentTreeRow[];
  loading?: boolean;
  statusPending?: boolean;
  expandedIds: Set<string>;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onToggleExpand: (id: string) => void;
  onEdit: (dept: DepartmentItem) => void;
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


  const activeChip = (active: boolean) => (
    <Chip
      label={active ? '사용' : '미사용'}
      size="small"
      color={active ? 'success' : 'default'}
      variant="filled"
    />
  );

  // 기존 -> 라이트 색만 인라인, mr 0.25 로 간격 / 변경 -> 다크모드 대응 actionIconSx, Tooltip, 간격은 Stack 에서
  const editBtn = (dept: DepartmentItem) => (
    <Tooltip title="부서 수정">
      <span>
        <GridIconButton
          aria-label="부서 수정"
          onClick={() => onEdit(dept)}
        >
          <EditPencilIcon />
        </GridIconButton>
      </span>
    </Tooltip>
  );

  const toggleBtn = (dept: DepartmentItem) => {
    const blockDeactivate = dept.active && (dept.hasChildren || dept.hasMembers);
    const label = blockDeactivate
      ? dept.hasChildren
        ? '하위 부서가 있어 미사용으로 변경할 수 없습니다.'
        : '배정된 인원이 있어 미사용으로 변경할 수 없습니다.'
      : dept.active
        ? '미사용으로 변경'
        : '사용으로 변경';
    return (
      <Tooltip title={label}>
        <span>
          <GridIconButton
            aria-label={label}
            tone={dept.active ? 'danger' : 'success'}
            onClick={() => onToggleActive(dept)}
            disabled={statusPending || blockDeactivate}
          >
            {/* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */}
            <Power />
          </GridIconButton>
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
            <TableCell width="240">부서명</TableCell>
            <TableCell width="240">상위 부서</TableCell>
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
                      backgroundColor: '#f0f7ff',
                    },
                    '&:hover .MuiTableCell-root': {
                      backgroundColor: '#e2efff',
                    },
                  }}
                >
                  <TableCell align="center">
                    {children.length > 0 ? (
                      <GridIconButton
                        onClick={() => onToggleExpand(dept.id)}
                      >
                        {expandedIds.has(dept.id) ? (
                          /* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */
                          <ChevronUp />
                        ) : (
                          /* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */
                          <ChevronDown />
                        )}
                      </GridIconButton>
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
                          backgroundColor: '#f8fbff',
                        },
                        '& .MuiTableCell-root:first-of-type': {
                          borderLeft: '4px solid #1f4f8f',
                        },
                        '&:hover .MuiTableCell-root': {
                          backgroundColor: '#edf4ff',
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
                              // 기존 -> isDarkMode 로 강조선 색 분기 / 변경 -> nav.accent 토큰
                              bgcolor: 'nav.accent',
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
