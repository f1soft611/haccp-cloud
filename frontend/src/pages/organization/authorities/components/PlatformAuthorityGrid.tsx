import { Link, ToggleLeft, ToggleRight } from 'lucide-react';
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
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { APP_LABELS } from '../../../../shared/constants/labels';
import type { PlatformRoleItem } from '../../../../services/platform-admin/platformRoleService';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";
import {INACTIVE_ROW_CLASS} from "../../../../app/theme.ts";

export function PlatformAuthorityGrid(props: {
  rows: PlatformRoleItem[];
  loading?: boolean;
  onMenuMapping: (role: PlatformRoleItem) => void;
  onEdit: (role: PlatformRoleItem) => void;
  onToggleActive: (role: PlatformRoleItem) => void;
}) {
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
          {/* 데이터 컬럼에 고정 너비를 줘야 빈 칸이 남는 폭을 차지함 (사용자관리와 동일) */}
          <TableCell width={160}>권한 코드</TableCell>
          <TableCell width={200}>권한명</TableCell>
          <TableCell width={320}>설명</TableCell>
          <TableCell aria-hidden />
          <TableCell width={120}>
            작업
          </TableCell>
          <TableCell width={90}>
            활성상태
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
                <TableCell aria-hidden />
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} align="center">
              권한 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((role) => {
              const toggleLabel = role.active
                ? APP_LABELS.action.deactivate
                : APP_LABELS.action.activate;
              return (
                <TableRow key={role.id} hover className={role.active ? undefined : INACTIVE_ROW_CLASS}>
                  <TableCell align="center">{role.code}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <span>{role.name || '-'}</span>
                      {role.systemRole ? (
                        <Chip size="small" color="warning" label="시스템" />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell aria-hidden />
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {/* 비활성 권한은 수정 불가 (사용자관리와 동일) */}
                      {role.active ? (
                        <>
                          <Tooltip title="메뉴 매핑">
                            <span>
                              <GridIconButton
                                aria-label="메뉴 매핑"
                                onClick={() => onMenuMapping(role)}
                              >
                                <Link />
                              </GridIconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="권한 수정">
                            <span>
                              <GridIconButton
                                aria-label="권한 수정"
                                disabled={role.systemRole}
                                onClick={() => onEdit(role)}
                              >
                                <EditPencilIcon />
                              </GridIconButton>
                            </span>
                          </Tooltip>
                        </>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    {/* 상태 칩 + 비활성화 버튼을 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작 */}
                    <Tooltip title={toggleLabel}>
                      <span>
                        <GridIconButton
                          aria-label={toggleLabel}
                          aria-pressed={role.active}
                          disabled={role.systemRole}
                          onClick={() => onToggleActive(role)}
                          sx={{ color: role.active ? 'primary.main' : 'grey.400' }}
                        >
                          {role.active ? <ToggleRight /> : <ToggleLeft />}
                        </GridIconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          : null}
      </TableBody>
    </AdminGrid>
  );
}