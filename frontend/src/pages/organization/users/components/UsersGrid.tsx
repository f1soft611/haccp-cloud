import { Power } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Chip,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import type { UserItem } from '../../../../services/organization/usersService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

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
                        <GridIconButton
                          aria-label="사용자 수정"
                          onClick={() => onEdit(row)}
                        >
                          {/* 기존 -> MUI EditOutlinedIcon / 변경 -> 시안 bticon_wri.svg 아이콘 */}
                          <EditPencilIcon />
                        </GridIconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={row.active ? '로그인 차단' : '차단 해제'}>
                      <span>
                        <GridIconButton
                          size="small"
                          aria-label={row.active ? '로그인 차단' : '차단 해제'}
                          onClick={() => onToggle(row)}
                          tone={row.active ? 'danger' : 'success'}
                        >
                          {/* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */}
                          <Power />
                        </GridIconButton>
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
