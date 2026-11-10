import { Power, Trash } from 'lucide-react';
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
import type { EquipmentItem } from '../../../../services/basicinfo/equipmentService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
  getCommonCodeName,
  useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

type EquipmentGridProps = {
  rows: EquipmentItem[];
  loading?: boolean;
  onEdit: (equipment: EquipmentItem) => void;
  onDelete: (equipment: EquipmentItem) => void;
  onRestore: (equipment: EquipmentItem) => void;
};

export function EquipmentGrid({
                                rows,
                                loading,
                                onEdit,
                                onDelete,
                                onRestore,
                              }: EquipmentGridProps) {
  const vcKindOptions = useCommonCodeOptions(COMMON_CODE_GROUP.VC_KIND);

  return (
    <AdminGrid ariaLabel="설비 목록">
      <TableHead>
        <TableRow>
          <TableCell width={100}>관리코드</TableCell>
          <TableCell width={120}>설비코드</TableCell>
          <TableCell>설비명</TableCell>
          <TableCell width={100}>설비종류</TableCell>
          <TableCell width={110}>구입일</TableCell>
          <TableCell>설치장소</TableCell>
          <TableCell width={110}>검교정구분</TableCell>
          <TableCell width={100}>검교정주기</TableCell>
          <TableCell width={90} align="center">
            상태
          </TableCell>
          <TableCell width={120} align="center">
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`equipment-grid-skeleton-${index}`}>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="78%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="58%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="50%" />
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
            <TableCell colSpan={10} align="center">
              조회된 설비가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.equipSysCd}</TableCell>
                <TableCell>{row.equipCd}</TableCell>
                <TableCell>{row.equipNm}</TableCell>
                <TableCell>{row.equipKind || '-'}</TableCell>
                <TableCell>{row.purDate || '-'}</TableCell>
                <TableCell>{row.location || '-'}</TableCell>
                <TableCell>{getCommonCodeName(vcKindOptions, row.vcKind) || '-'}</TableCell>
                <TableCell>{row.vcCycle !== null ? `${row.vcCycle}개월` : '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={row.active ? 'success' : 'default'}
                    label={row.active ? '사용' : '미사용'}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="설비 수정">
                      <span>
                        <GridIconButton
                          aria-label="설비 수정"
                          onClick={() => onEdit(row)}
                        >
                          <EditPencilIcon />
                        </GridIconButton>
                      </span>
                    </Tooltip>
                    {row.active ? (
                      <Tooltip title="설비 삭제">
                        <span>
                          <GridIconButton
                            aria-label="설비 삭제"
                            tone="danger"
                            onClick={() => onDelete(row)}
                          >
                            <Trash />
                          </GridIconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title="사용으로 변경">
                        <span>
                          <GridIconButton
                            aria-label="설비 다시 사용"
                            tone="success"
                            onClick={() => onRestore(row)}
                          >
                            <Power fontSize="small" />
                          </GridIconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
