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

export type AuthoritySearchValue = {
  searchField: 'code' | 'name' | 'description';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

export function PlatformAuthoritySearchBar(props: {
  value: AuthoritySearchValue;
  disabled?: boolean;
  showCreateButton?: boolean;
  onChange: (next: AuthoritySearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
}) {
  const {
    value,
    disabled = false,
    showCreateButton = true,
    onChange,
    onSearch,
    onCreate,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="authority-search-field-label">검색 조건</InputLabel>
          <Select
            labelId="authority-search-field-label"
            label="검색 조건"
            value={value.searchField}
            onChange={(event) =>
              onChange({
                ...value,
                searchField: event.target.value as
                  | 'code'
                  | 'name'
                  | 'description',
              })
            }
          >
            <MenuItem value="code">권한 코드</MenuItem>
            <MenuItem value="name">권한명</MenuItem>
            <MenuItem value="description">설명</MenuItem>
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
          <InputLabel id="authority-status-label">상태</InputLabel>
          <Select
            labelId="authority-status-label"
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

        {showCreateButton ? (
          <Button variant="contained" onClick={onCreate} disabled={disabled}>
            + 권한 추가
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
