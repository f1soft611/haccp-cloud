import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from '@mui/material';

export type PlanSearchBarValue = {
  searchField: 'code' | 'name';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

export function PlatformPlanSearchBar(props: {
  value: PlanSearchBarValue;
  disabled?: boolean;
  onChange: (next: PlanSearchBarValue) => void;
  onSearch: () => void;
}) {
  const { value, disabled = false, onChange, onSearch } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="plan-search-field-label">검색 조건</InputLabel>
          <Select
            labelId="plan-search-field-label"
            label="검색 조건"
            value={value.searchField}
            onChange={(event) =>
              onChange({
                ...value,
                searchField: event.target.value as 'code' | 'name',
              })
            }
          >
            <MenuItem value="name">플랜명</MenuItem>
            <MenuItem value="code">플랜 코드</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="검색어"
          size="small"
          value={value.searchKeyword}
          onChange={(event) =>
            onChange({
              ...value,
              searchKeyword: event.target.value,
            })
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="plan-filter-active-label">상태</InputLabel>
          <Select
            labelId="plan-filter-active-label"
            label="상태"
            value={value.filterActive}
            onChange={(event) =>
              onChange({
                ...value,
                filterActive: event.target.value as 'all' | 'Y' | 'N',
              })
            }
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="Y">활성</MenuItem>
            <MenuItem value="N">비활성</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={onSearch} disabled={disabled}>
          조회
        </Button>
      </Stack>
    </Paper>
  );
}
