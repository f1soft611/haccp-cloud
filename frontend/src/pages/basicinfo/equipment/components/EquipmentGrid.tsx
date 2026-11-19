import { ToggleLeft, ToggleRight } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Skeleton,
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
import { INACTIVE_ROW_CLASS } from '../../../../app/theme';

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
          {/* 데이터 컬럼에 고정 너비를 줘야 빈 칸이 남는 폭을 차지함 (사용자관리와 동일) */}
          <TableCell width={100}>관리코드</TableCell>
          <TableCell width={120}>설비코드</TableCell>
          <TableCell width={200}>설비명</TableCell>
          <TableCell width={100}>설비종류</TableCell>
          <TableCell width={120}>구입일</TableCell>
          <TableCell width={160}>설치장소</TableCell>
          <TableCell width={110}>검교정구분</TableCell>
          <TableCell width={100}>검교정주기</TableCell>
          <TableCell aria-hidden />
          <TableCell width={80}>작업</TableCell>
          <TableCell width={90}>활성상태</TableCell>
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
                <TableCell aria-hidden />
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
            <TableCell colSpan={11} align="center">
              조회된 설비가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => {
              const toggleLabel = row.active ? '비활성화' : '활성화';
              return (
                <TableRow key={row.id} hover className={row.active ? undefined : INACTIVE_ROW_CLASS}>
                  <TableCell align="center">{row.equipSysCd}</TableCell>
                  <TableCell align="center">{row.equipCd}</TableCell>
                  <TableCell>{row.equipNm}</TableCell>
                  <TableCell align="center">{row.equipKind || '-'}</TableCell>
                  <TableCell align="center">{row.purDate || '-'}</TableCell>
                  <TableCell align="center">{row.location || '-'}</TableCell>
                  <TableCell align="center">{getCommonCodeName(vcKindOptions, row.vcKind) || '-'}</TableCell>
                  <TableCell align="center">{row.vcCycle !== null ? `${row.vcCycle}개월` : '-'}</TableCell>
                  <TableCell aria-hidden />
                  <TableCell align="center">
                    {/* 비활성 설비는 수정 불가, 셀은 남겨 정렬 유지 (사용자관리와 동일) */}
                    {row.active ? (
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
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {/* 상태 칩 + 삭제/다시사용 버튼을 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작 */}
                    <Tooltip title={toggleLabel}>
                      <span>
                        <GridIconButton
                          aria-label={toggleLabel}
                          aria-pressed={row.active}
                          onClick={() => (row.active ? onDelete(row) : onRestore(row))}
                          sx={{ color: row.active ? 'primary.main' : 'grey.400' }}
                        >
                          {row.active ? <ToggleRight /> : <ToggleLeft />}
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