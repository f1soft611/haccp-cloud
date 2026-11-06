import { Button, TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const SEARCH_FIELD_OPTIONS = [
  { value: 'menuNm', label: '메뉴명' },
  { value: 'menuDc', label: '설명' },
  { value: 'menuUrl', label: 'URL' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

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
    <SearchFilterBar
      onSearch={onSearch}
      disabled={loading}
      actions={
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={loading || !canManage}
        >
          + 메뉴 추가
        </Button>
      }
    >
      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 120 }}
      />

      <TextField
        label="검색어"
        value={value.searchKeyword}
        onChange={(e) =>
          onChange({ ...value, searchKeyword: e.target.value })
        }
        size="small"
        sx={{ flex: 1, minWidth: 200 }}
      />

      <AppSelect
        size="small"
        label="사용여부"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        sx={{ minWidth: 120 }}
      />
    </SearchFilterBar>
  );
}
