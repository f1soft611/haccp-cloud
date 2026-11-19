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
import type { MaterialItem } from '../../../../services/basicinfo/materialsService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
  getCommonCodeName,
  useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";
import { INACTIVE_ROW_CLASS } from '../../../../app/theme';

type MaterialsGridProps = {
  rows: MaterialItem[];
  loading?: boolean;
  onEdit: (material: MaterialItem) => void;
  onDelete: (material: MaterialItem) => void;
  onRestore: (material: MaterialItem) => void;
};

export function MaterialsGrid({
  rows,
  loading,
  onEdit,
  onDelete,
  onRestore,
}: MaterialsGridProps) {
  const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);
  const itemTypeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_TYPE);
  const materialKindOptions = useCommonCodeOptions(COMMON_CODE_GROUP.MATERIAL_TYPE);
  const storeMethodOptions = useCommonCodeOptions(COMMON_CODE_GROUP.STORE_METHOD);
  const expiryStatusOptions = useCommonCodeOptions(COMMON_CODE_GROUP.EXPIRY_STATUS);

  // 소비기한: 숫자 + 기준 이름 (예: 12개월), 기준이 없음이면 '-'
  const formatExpiry = (row: MaterialItem) =>
      row.expiryedStatus !== 'NONE' && row.expiryedCount !== null
          ? `${row.expiryedCount}${getCommonCodeName(expiryStatusOptions, row.expiryedStatus)}`
          : '-';

  return (
    <AdminGrid ariaLabel="품목 목록">
      <TableHead>
        <TableRow>
          {/* 데이터 컬럼에 고정 너비를 줘야 빈 칸이 남는 폭을 차지함 (사용자관리와 동일) */}
          <TableCell width={100} align="center">품목코드</TableCell>
          <TableCell width={200} align="center">품목명</TableCell>
          <TableCell width={140} align="center">규격</TableCell>
          <TableCell width={100} align="center">품목계정</TableCell>
          <TableCell width={100} align="center">중량</TableCell>
          <TableCell width={80} align="center">단위</TableCell>
          <TableCell width={100} align="center">품목유형</TableCell>
          <TableCell width={100} align="center">보관방법</TableCell>
          <TableCell width={90} align="center">소비기한</TableCell>
          <TableCell width={130} align="center">품목보고번호</TableCell>
          <TableCell aria-hidden />
          <TableCell width={80} align="center">작업</TableCell>
          <TableCell width={90} align="center">활성상태</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`materials-grid-skeleton-${index}`}>
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
                  <Skeleton variant="text" width="50%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="50%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="50%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
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
            <TableCell colSpan={13} align="center">
              조회된 품목이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => {
              const toggleLabel = row.active ? '비활성화' : '활성화';
              return (
                <TableRow key={row.id} hover className={row.active ? undefined : INACTIVE_ROW_CLASS}>
                  {/* 기존 -> 본문 셀 기본(좌측) 정렬 / 변경 -> 품목코드, 품목계정, 중량, 단위 가운데정렬 */}
                  <TableCell align="center">{row.materialCode}</TableCell>
                  <TableCell>{row.materialName}</TableCell>
                  <TableCell>{row.materialSpec || '-'}</TableCell>
                  <TableCell align="center">{getCommonCodeName(itemTypeOptions, row.itemType) || '-'}</TableCell>
                  <TableCell align="center">
                    {row.materialWeight !== null ? row.materialWeight : '-'}
                  </TableCell>
                  <TableCell align="center">{getCommonCodeName(unitOptions, row.unit) || '-'}</TableCell>
                  <TableCell align="center">{getCommonCodeName(materialKindOptions, row.materialKind) || '-'}</TableCell>
                  <TableCell align="center">{getCommonCodeName(storeMethodOptions, row.storeMethod) || '-'}</TableCell>
                  <TableCell align="center">{formatExpiry(row)}</TableCell>
                  <TableCell align="center">{row.kfdaReportNo || '-'}</TableCell>
                  <TableCell aria-hidden />
                  <TableCell align="center">
                    {/* 비활성 품목은 수정 불가(백엔드 수정 쿼리도 활성만), 셀은 남겨 정렬 유지 */}
                    {row.active ? (
                      <Tooltip title="품목 수정">
                        <span>
                          <GridIconButton
                            aria-label="품목 수정"
                            onClick={() => onEdit(row)}
                          >
                            <EditPencilIcon />
                          </GridIconButton>
                        </span>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {/* 삭제 버튼 + 상태를 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작 */}
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