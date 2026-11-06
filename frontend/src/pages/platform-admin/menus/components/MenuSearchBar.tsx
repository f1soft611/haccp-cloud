import { Button, MenuItem, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

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
      <TextField
        select
        label="검색 조건"
        value={value.searchField}
        onChange={(e) =>
          onChange({ ...value, searchField: e.target.value })
        }
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="menuNm">메뉴명</MenuItem>
        <MenuItem value="menuDc">설명</MenuItem>
        <MenuItem value="menuUrl">URL</MenuItem>
      </TextField>

      <TextField
        label="검색어"
        value={value.searchKeyword}
        onChange={(e) =>
          onChange({ ...value, searchKeyword: e.target.value })
        }
        size="small"
        sx={{ flex: 1, minWidth: 200 }}
      />

      <TextField
        select
        label="사용여부"
        value={value.filterActive}
        onChange={(e) =>
          onChange({ ...value, filterActive: e.target.value })
        }
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="all">전체</MenuItem>
        <MenuItem value="Y">사용</MenuItem>
        <MenuItem value="N">미사용</MenuItem>
      </TextField>
    </SearchFilterBar>
  );
}
