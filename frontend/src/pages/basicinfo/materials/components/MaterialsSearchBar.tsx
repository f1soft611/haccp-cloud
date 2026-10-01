import { Button, Paper, Stack, TextField } from '@mui/material';

export type MaterialsSearchValue = {
  keyword: string;
};

type MaterialsSearchBarProps = {
  value: MaterialsSearchValue;
  disabled?: boolean;
  onChange: (value: MaterialsSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function MaterialsSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: MaterialsSearchBarProps) {
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
          placeholder="품목코드, 품목명, 규격, 품목계정"
          value={value.keyword}
          onChange={(event) =>
            onChange({
              ...value,
              keyword: event.target.value,
            })
          }
        />

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
          품목 등록
        </Button>
      </Stack>
    </Paper>
  );
}
