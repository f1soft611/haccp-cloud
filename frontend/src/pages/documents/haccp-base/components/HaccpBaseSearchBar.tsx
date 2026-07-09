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
import type { HaccpCategoryOption } from '../types';

export type HaccpBaseSearchValue = {
  categoryId: 'ALL' | string;
  keyword: string;
};

export function HaccpBaseSearchBar(props: {
  value: HaccpBaseSearchValue;
  categoryOptions: HaccpCategoryOption[];
  onChange: (next: HaccpBaseSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
  onCategorySettings: () => void;
}) {
  const {
    value,
    categoryOptions,
    onChange,
    onSearch,
    onCreate,
    onCategorySettings,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="haccp-base-category-label">분류설정</InputLabel>
          <Select
            labelId="haccp-base-category-label"
            value={value.categoryId}
            label="분류설정"
            onChange={(event) =>
              onChange({
                ...value,
                categoryId: event.target.value,
              })
            }
          >
            <MenuItem value="ALL">전체</MenuItem>
            {categoryOptions.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="구분명, 담당자 검색"
          value={value.keyword}
          onChange={(event) =>
            onChange({
              ...value,
              keyword: event.target.value,
            })
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          sx={{ flex: 1, minWidth: 260 }}
        />

        <Button variant="contained" onClick={onSearch}>
          조회
        </Button>
        <Button variant="contained" onClick={onCreate}>
          + 업무 추가
        </Button>
        <Button variant="outlined" onClick={onCategorySettings}>
          분류 설정
        </Button>
      </Stack>
    </Paper>
  );
}
