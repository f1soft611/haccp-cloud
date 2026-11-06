import { Button, MenuItem, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

export type DepartmentSearchValue = {
  searchKeyword: string;
  filterActive: string;
};

export function DepartmentSearchBar(props: {
  value: DepartmentSearchValue;
  loading?: boolean;
  onChange: (next: DepartmentSearchValue) => void;
  onSearch: () => void;
  onAdd: () => void;
}) {
  const { value, loading = false, onChange, onSearch, onAdd } = props;

  return (
    <SearchFilterBar
      onSearch={onSearch}
      disabled={loading}
      actions={
        <Button variant="contained" onClick={onAdd} disabled={loading}>
          + 부서 추가
        </Button>
      }
    >
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
