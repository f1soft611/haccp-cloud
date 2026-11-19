import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Box,
  Skeleton,
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
import {INACTIVE_ROW_CLASS} from "../../../../app/theme.ts";

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

  // 비활성 부서는 수정 불가 (사용자관리와 동일), 셀은 남겨 정렬 유지
  const editBtn = (dept: DepartmentItem) =>
    dept.active ? (
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
    ) : null;

  const toggleBtn = (dept: DepartmentItem) => {
    const blockDeactivate = dept.active && (dept.hasChildren || dept.hasMembers);
    const label = blockDeactivate
      ? dept.hasChildren
        ? '하위 부서가 있어 미사용으로 변경할 수 없습니다.'
        : '배정된 인원이 있어 미사용으로 변경할 수 없습니다.'
      : dept.active
        ? '미사용으로 변경'
        : '사용으로 변경';
    // 사용여부 칩 + 전원 버튼을 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작
    return (
      <Tooltip title={label}>
        <span>
          <GridIconButton
            aria-label={label}
            aria-pressed={dept.active}
            onClick={() => onToggleActive(dept)}
            disabled={statusPending || blockDeactivate}
            sx={{ color: dept.active ? 'primary.main' : 'grey.400' }}
          >
            {dept.active ? <ToggleRight /> : <ToggleLeft />}
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
            <TableCell width="80" >순서</TableCell>
            <TableCell aria-hidden />
            <TableCell width="80" >작업</TableCell>
            <TableCell width="90" >사용여부</TableCell>
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
                <TableCell aria-hidden />
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
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
                  className={dept.active ? undefined : INACTIVE_ROW_CLASS}
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
                          <ChevronUp />
                        ) : (
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
                  <TableCell aria-hidden />
                  <TableCell align="center">{editBtn(dept)}</TableCell>
                  <TableCell align="center">{toggleBtn(dept)}</TableCell>
                </TableRow>

                {/* 자식 부서 행 (확장 시) */}
                {expandedIds.has(dept.id) &&
                  children.map((child) => (
                    <TableRow
                      key={child.id}
                      className={child.active ? undefined : INACTIVE_ROW_CLASS}
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
                      <TableCell aria-hidden />
                      <TableCell align="center">{editBtn(child)}</TableCell>
                      <TableCell align="center">{toggleBtn(child)}</TableCell>
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
