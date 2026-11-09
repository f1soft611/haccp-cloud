import {
  Box,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

type GridPaginationBarProps = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
};

export function GridPaginationBar({
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: GridPaginationBarProps) {
  const scope = useSharedScope();
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    <Stack
      {...scope}
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
    >
      <Typography variant="body2" className={styles.textSecondary}>
        총 {totalCount}건
      </Typography>

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="flex-end"
      >
        <Box className={styles.gridPaginationSize}>
          <Select
            size="small"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            fullWidth
            inputProps={{ 'aria-label': '페이지 크기 선택' }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}개
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Pagination
          page={pageIndex}
          count={totalPages}
          onChange={(_, page) => onPageChange(page)}
          shape="rounded"
          color="primary"
        />
      </Stack>
    </Stack>
  );
}
