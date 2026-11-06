import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import type { HaccpCategoryOption } from '../types';

export type HaccpBaseSearchValue = {
  categoryId: 'ALL' | string;
  keyword: string;
  useAt: 'all' | 'Y' | 'N';
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
    <SearchFilterBar
      onSearch={onSearch}
      actions={
        <>
          <Button variant="contained" onClick={onCreate}>
            + 업무 추가
          </Button>
          <Button variant="outlined" onClick={onCategorySettings}>
            분류 설정
          </Button>
        </>
      }
    >
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="haccp-base-category-label">업무분류</InputLabel>
        <Select
          labelId="haccp-base-category-label"
          value={value.categoryId}
          label="업무분류"
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
        sx={{ flex: 1, minWidth: 260 }}
      />

      <TextField
        select
        size="small"
        label="사용유무"
        value={value.useAt}
        onChange={(event) =>
          onChange({
            ...value,
            useAt: event.target.value as HaccpBaseSearchValue['useAt'],
          })
        }
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="all">전체</MenuItem>
        <MenuItem value="Y">사용</MenuItem>
        <MenuItem value="N">미사용</MenuItem>
      </TextField>
    </SearchFilterBar>
  );
}
