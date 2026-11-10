import { Link, Power } from 'lucide-react';
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
import {
  APP_LABELS,
  getActiveLabel,
} from '../../../../shared/constants/labels';
import type { PlatformRoleItem } from '../../../../services/platform-admin/platformRoleService';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

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
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="메뉴 매핑">
                      <span>
                        <GridIconButton
                          aria-label="메뉴 매핑"
                          onClick={() => onMenuMapping(role)}
                        >
                          {/* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */}
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
                    <Tooltip
                      title={
                        role.active
                          ? APP_LABELS.action.deactivate
                          : APP_LABELS.action.activate
                      }
                    >
                      <span>
                        <GridIconButton
                          disabled={role.systemRole}
                          aria-label={
                            role.active
                              ? APP_LABELS.action.deactivate
                              : APP_LABELS.action.activate
                          }
                          tone={role.active ? 'danger' : 'success'}
                          onClick={() => onToggleActive(role)}
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
