import { Button, TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import type { HaccpCategoryOption } from '../types';

const USE_AT_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

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
      <AppSelect
        size="small"
        label="업무분류"
        value={value.categoryId}
        onChange={(categoryId) => onChange({ ...value, categoryId })}
        options={[
          { value: 'ALL', label: '전체' },
          ...categoryOptions.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ]}
        sx={{ minWidth: 180 }}
      />

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

      <AppSelect
        size="small"
        label="사용유무"
        value={value.useAt}
        onChange={(useAt) => onChange({ ...value, useAt })}
        options={USE_AT_FILTER_OPTIONS}
        sx={{ minWidth: 140 }}
      />
    </SearchFilterBar>
  );
}
