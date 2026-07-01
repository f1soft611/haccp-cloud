import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export type DepartmentSearchValue = {
  searchKeyword: string;
  filterActive: string;
};

export function DepartmentSearchBar(props: {
  value: DepartmentSearchValue;
  loading?: boolean;
  onChange: (next: DepartmentSearchValue) => void;
  onSearch: () => void;
  onAdd: () => void;
}) {
  const { value, loading = false, onChange, onSearch, onAdd } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems="flex-end"
      >
        <TextField
          label="검색어"
          value={value.searchKeyword}
          onChange={(e) =>
            onChange({ ...value, searchKeyword: e.target.value })
          }
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
        />

        <Box sx={{ minWidth: 120 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            사용여부
          </Typography>
          <Select
            value={value.filterActive}
            onChange={(e) =>
              onChange({ ...value, filterActive: e.target.value })
            }
            size="small"
            fullWidth
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </Select>
        </Box>

        <Button variant="contained" onClick={onSearch} disabled={loading}>
          조회
        </Button>
        <Button variant="contained" onClick={onAdd} disabled={loading}>
          + 부서 추가
        </Button>
      </Stack>
    </Paper>
  );
}
