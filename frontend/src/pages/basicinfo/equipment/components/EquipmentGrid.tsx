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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { EquipmentItem } from '../../../../services/basicinfo/equipmentService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';

type EquipmentGridProps = {
  rows: EquipmentItem[];
  loading?: boolean;
  onEdit: (equipment: EquipmentItem) => void;
  onDelete: (equipment: EquipmentItem) => void;
};

export function EquipmentGrid({
  rows,
  loading,
  onEdit,
  onDelete,
}: EquipmentGridProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
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
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={row.active ? 'success' : 'default'}
                    label={row.active ? '사용' : '미사용'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      aria-label="설비 수정"
                      onClick={() => onEdit(row)}
                      sx={{
                        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                        bgcolor: isDarkMode
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(31, 79, 143, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(31, 79, 143, 0.16)',
                        },
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="설비 삭제"
                      onClick={() => onDelete(row)}
                      sx={{
                        color: isDarkMode ? '#f87171' : '#c53b3b',
                        bgcolor: isDarkMode
                          ? 'rgba(248, 113, 113, 0.12)'
                          : 'rgba(197, 59, 59, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(248, 113, 113, 0.2)'
                            : 'rgba(197, 59, 59, 0.16)',
                        },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
