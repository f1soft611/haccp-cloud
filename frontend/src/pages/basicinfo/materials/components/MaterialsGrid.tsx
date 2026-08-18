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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MaterialItem } from '../../../../services/basicinfo/materialsService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';

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
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <AdminGrid ariaLabel="품목 목록">
      <TableHead>
        <TableRow>
          <TableCell width={100}>품목코드</TableCell>
          <TableCell>품목명</TableCell>
          <TableCell width={100}>품목계정</TableCell>
          <TableCell>규격</TableCell>
          <TableCell width={100}>중량</TableCell>
          <TableCell width={80}>단위</TableCell>
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
            <TableCell colSpan={7} align="center">
              조회된 품목이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.materialCode}</TableCell>
                <TableCell>{row.materialName}</TableCell>
                <TableCell>{row.itemType || '-'}</TableCell>
                <TableCell>{row.materialSpec || '-'}</TableCell>
                <TableCell>
                  {row.materialWeight !== null ? row.materialWeight : '-'}
                </TableCell>
                <TableCell>{row.unit || '-'}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      aria-label="품목 수정"
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
                      aria-label="품목 삭제"
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
