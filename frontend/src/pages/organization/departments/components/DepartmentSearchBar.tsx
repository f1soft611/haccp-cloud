import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import {Plus} from "lucide-react";

const ACTIVE_FILTER_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

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
        <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={onAdd}
            disabled={loading}>
          부서 추가
        </Button>
      }
    >
      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        emptyLabel="전체"
        sx={{ minWidth: 120 }}
      />
      <AppTextField
        placeholder="부서명 검색"
        slotProps={{ htmlInput: { 'aria-label': '부서명 검색' } }}
        value={value.searchKeyword}
        onChange={(searchKeyword) =>
          onChange({ ...value, searchKeyword })
        }
        size="small"
        sx={{ flex: 1, minWidth: 200 }}
      />
    </SearchFilterBar>
  );
}
