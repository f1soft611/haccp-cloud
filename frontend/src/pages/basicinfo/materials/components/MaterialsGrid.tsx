import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  IconButton,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MaterialItem } from '../../../../services/basicinfo/materialsService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
  getCommonCodeName,
  useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';

type MaterialsGridProps = {
  rows: MaterialItem[];
  loading?: boolean;
  onEdit: (material: MaterialItem) => void;
  onDelete: (material: MaterialItem) => void;
};

export function MaterialsGrid({
  rows,
  loading,
  onEdit,
  onDelete,
}: MaterialsGridProps) {
  const theme = useTheme();
  const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);
  const itemTypeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_TYPE);
  const materialKindOptions = useCommonCodeOptions(COMMON_CODE_GROUP.MATERIAL_TYPE);
  const storeMethodOptions = useCommonCodeOptions(COMMON_CODE_GROUP.STORE_METHOD);
  const expiryStatusOptions = useCommonCodeOptions(COMMON_CODE_GROUP.EXPIRY_STATUS);
  const isDarkMode = theme.palette.mode === 'dark';

  const actionIconSx = {
    color: isDarkMode ? '#fbbf24' : '#1f4f8f',
    bgcolor: isDarkMode
      ? 'rgba(251, 191, 36, 0.12)'
      : 'rgba(31, 79, 143, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(251, 191, 36, 0.2)'
        : 'rgba(31, 79, 143, 0.16)',
    },
  };

  const dangerIconSx = {
    color: isDarkMode ? '#f87171' : '#c53b3b',
    bgcolor: isDarkMode
      ? 'rgba(248, 113, 113, 0.12)'
      : 'rgba(197, 59, 59, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(248, 113, 113, 0.2)'
        : 'rgba(197, 59, 59, 0.16)',
    },
  };

  // 소비기한: 숫자 + 기준 이름 (예: 12개월), 기준이 없음이면 '-'
  const formatExpiry = (row: MaterialItem) =>
      row.expiryedStatus !== 'NONE' && row.expiryedCount !== null
          ? `${row.expiryedCount}${getCommonCodeName(expiryStatusOptions, row.expiryedStatus)}`
          : '-';

  return (
    <AdminGrid ariaLabel="품목 목록">
      <TableHead>
        {/* 기존 -> 헤더 기본(좌측) 정렬 / 변경 -> 모든 헤더 가운데정렬 */}
        <TableRow>
          <TableCell width={100} align="center">품목코드</TableCell>
          <TableCell align="center">품목명</TableCell>
          <TableCell align="center">규격</TableCell>
          <TableCell width={100} align="center">품목계정</TableCell>
          <TableCell width={100} align="center">중량</TableCell>
          <TableCell width={80} align="center">단위</TableCell>
          <TableCell width={100} align="center">품목유형</TableCell>
          <TableCell width={100} align="center">보관방법</TableCell>
          <TableCell width={90} align="center">소비기한</TableCell>
          <TableCell width={130} align="center">품목보고번호</TableCell>
          <TableCell width={120} align="center">
            작업
          </TableCell>
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
            <TableCell colSpan={11} align="center">
              조회된 품목이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                {/* 기존 -> 본문 셀 기본(좌측) 정렬 / 변경 -> 품목코드·품목계정·중량·단위 가운데정렬 */}
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
                <TableCell align="center">
                  {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="품목 수정">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="품목 수정"
                          onClick={() => onEdit(row)}
                          sx={actionIconSx}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="품목 삭제">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="품목 삭제"
                          onClick={() => onDelete(row)}
                          sx={dangerIconSx}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
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
