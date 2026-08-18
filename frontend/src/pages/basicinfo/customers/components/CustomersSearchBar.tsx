import { Button, MenuItem, Paper, Stack, TextField } from '@mui/material';

export type CustomersSearchValue = {
  keyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

type CustomersSearchBarProps = {
  value: CustomersSearchValue;
  disabled?: boolean;
  onChange: (value: CustomersSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function CustomersSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: CustomersSearchBarProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        <TextField
          size="small"
          fullWidth
          label="검색어"
          placeholder="거래처코드, 거래처명, 대표자명, 사업자번호"
          value={value.keyword}
          onChange={(event) =>
            onChange({
              ...value,
              keyword: event.target.value,
            })
          }
        />

        <TextField
          select
          size="small"
          label="상태"
          value={value.filterActive}
          onChange={(event) =>
            onChange({
              ...value,
              filterActive: event.target
                .value as CustomersSearchValue['filterActive'],
            })
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">전체</MenuItem>
          <MenuItem value="Y">사용</MenuItem>
          <MenuItem value="N">미사용</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={onSearch}
          disabled={disabled}
          sx={{ minWidth: 96 }}
        >
          검색
        </Button>

        <Button
          variant="contained"
          onClick={onCreate}
          disabled={disabled}
          sx={{ minWidth: 120 }}
        >
          거래처 등록
        </Button>
      </Stack>
    </Paper>
  );
}
