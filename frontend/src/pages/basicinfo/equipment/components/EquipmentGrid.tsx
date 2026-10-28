import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Chip,
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
import type { EquipmentItem } from '../../../../services/basicinfo/equipmentService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
  getCommonCodeName,
  useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';

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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const vcKindOptions = useCommonCodeOptions(COMMON_CODE_GROUP.VC_KIND);

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

  const successIconSx = {
    color: isDarkMode ? '#86efac' : '#2e7d32',
    bgcolor: isDarkMode
      ? 'rgba(134, 239, 172, 0.12)'
      : 'rgba(46, 125, 50, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(134, 239, 172, 0.2)'
        : 'rgba(46, 125, 50, 0.16)',
    },
  };

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
                        <IconButton
                          size="small"
                          aria-label="설비 수정"
                          onClick={() => onEdit(row)}
                          sx={actionIconSx}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {row.active ? (
                      <Tooltip title="설비 삭제">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="설비 삭제"
                            onClick={() => onDelete(row)}
                            sx={dangerIconSx}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      // 기존 -> title="사용으로 변경" 속성 / 변경 -> Tooltip 으로 이동
                      <Tooltip title="사용으로 변경">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="설비 다시 사용"
                            onClick={() => onRestore(row)}
                            sx={successIconSx}
                          >
                            <PowerSettingsNewOutlinedIcon fontSize="small" />
                          </IconButton>
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
