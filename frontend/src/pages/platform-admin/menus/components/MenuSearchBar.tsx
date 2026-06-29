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

export type MenuSearchValue = {
  searchField: string;
  searchKeyword: string;
  filterActive: string;
};

export function MenuSearchBar(props: {
  value: MenuSearchValue;
  loading?: boolean;
  canManage?: boolean;
  onChange: (next: MenuSearchValue) => void;
  onSearch: () => void;
  onAdd: () => void;
}) {
  const {
    value,
    loading = false,
    canManage = false,
    onChange,
    onSearch,
    onAdd,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems="flex-end"
      >
        <Box sx={{ minWidth: 120 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            검색 조건
          </Typography>
          <Select
            value={value.searchField}
            onChange={(e) =>
              onChange({ ...value, searchField: e.target.value })
            }
            size="small"
            fullWidth
          >
            <MenuItem value="menuNm">메뉴명</MenuItem>
            <MenuItem value="menuDc">설명</MenuItem>
            <MenuItem value="menuUrl">URL</MenuItem>
          </Select>
        </Box>

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
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={loading || !canManage}
        >
          + 메뉴 추가
        </Button>
      </Stack>
    </Paper>
  );
}
