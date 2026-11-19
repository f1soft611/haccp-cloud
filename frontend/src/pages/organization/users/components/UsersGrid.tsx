import { ToggleLeft, ToggleRight } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Avatar,
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
import { INACTIVE_ROW_CLASS } from '../../../../app/theme';

type UsersGridProps = {
  rows: UserItem[];
  roleNameByCode?: Record<string, string>;
  loading?: boolean;
  onEdit: (user: UserItem) => void;
  onToggle: (user: UserItem) => void;
};

// 용도: 이름 셀 프로필 아바타 크기/기본 아이콘 색 (이미지 없을 때 회색 사람 아이콘)
const AVATAR_SIZE = 28;
const avatarSx = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  bgcolor: 'grey.200',
  color: 'grey.400',
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
          <TableCell width={180} >이름</TableCell>
          <TableCell width={200} >이메일</TableCell>
          <TableCell width={150} >부서</TableCell>
          <TableCell width={120}>입사일</TableCell>
          <TableCell width={120}>퇴사일</TableCell>
          <TableCell aria-hidden />
          <TableCell width={120}>권한</TableCell>
          <TableCell width={80}>작업</TableCell>
          <TableCell width={90}>활성상태</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`users-grid-skeleton-${index}`}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Skeleton variant="circular" width={AVATAR_SIZE} height={AVATAR_SIZE} />
                    <Skeleton variant="text" width="50%" />
                  </Stack>
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
                <TableCell aria-hidden />
                <TableCell>
                  <Skeleton variant="text" width="52%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center">
              조회된 사용자가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover className={row.active ? undefined : INACTIVE_ROW_CLASS}>
                <TableCell align="center">
                  {/* 프로필 이미지 없거나 로드 실패 시 MUI Avatar 기본 Person 아이콘으로 폴백 */}
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                    <Avatar
                      src={row.profileImage}
                      alt={row.profileImage ? `${row.name} 프로필` : undefined}
                      sx={avatarSx}
                    />
                    <span>{row.name}</span>
                  </Stack>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell align="center" >{row.department || '-'}</TableCell>
                <TableCell align="center" >{row.joinDate || '-'}</TableCell>
                <TableCell align="center" >{row.retireDate || '-'}</TableCell>
                <TableCell aria-hidden />
                <TableCell align="center" >{roleLabel(row.roleCode, roleNameByCode)}</TableCell>
                <TableCell align="center">
                  {/* 비활성 사용자는 수정 불가, 셀은 남겨 정렬 유지 */}
                  {row.active ? (
                    <Tooltip title="사용자 수정">
                      <span>
                        <GridIconButton
                          aria-label="사용자 수정"
                          onClick={() => onEdit(row)}
                        >
                          <EditPencilIcon />
                        </GridIconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                </TableCell>
                <TableCell align="center">
                  {/* 상태 칩 + 로그인 차단 버튼을 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작 */}
                  <Tooltip title={row.active ? '비활성화' : '활성화'}>
                    <span>
                      <GridIconButton
                        aria-label={row.active ? '비활성화' : '활성화'}
                        aria-pressed={row.active}
                        onClick={() => onToggle(row)}
                        sx={{ color: row.active ? 'primary.main' : 'grey.400' }}
                      >
                        {row.active ? <ToggleRight /> : <ToggleLeft />}
                      </GridIconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
