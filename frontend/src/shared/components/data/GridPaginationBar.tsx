import {
  Box,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from '@mui/material';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';
import { appSelectMenuProps } from '../forms/AppSelect';

type GridPaginationBarProps = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
};

// 그리드 하단 페이징 바: 총 건수(왼쪽), 페이지 번호(가운데), 페이지 크기(오른쪽)
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

  return (
    <Box {...scope} className={`${scope.className} ${styles.gridPaginationBar}`}>
      <Typography variant="body2" className={styles.textSecondary}>
        총 {totalCount}건
      </Typography>

      <Pagination
        page={pageIndex}
        count={totalPages}
        onChange={(_, page) => onPageChange(page)}
        shape="rounded"
        color="primary"
      />

      <Box className={styles.gridPaginationSize}>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          fullWidth
          inputProps={{ 'aria-label': '페이지 크기 선택' }}
          MenuProps={appSelectMenuProps}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}개씩
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>

  );
}
