import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const SEARCH_FIELD_OPTIONS = [
  { value: 'name', label: '플랜명' },
  { value: 'code', label: '플랜 코드' },
] as const;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '활성' },
  { value: 'N', label: '비활성' },
] as const;

export type PlanSearchBarValue = {
  searchField: 'code' | 'name';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

export function PlatformPlanSearchBar(props: {
  value: PlanSearchBarValue;
  disabled?: boolean;
  onChange: (next: PlanSearchBarValue) => void;
  onSearch: () => void;
}) {
  const { value, disabled = false, onChange, onSearch } = props;

  return (
    <SearchFilterBar onSearch={onSearch} disabled={disabled}>
      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        sx={{ minWidth: 120 }}
      />
      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 140 }}
      />
      <AppTextField
        placeholder="검색어 입력"
        slotProps={{ htmlInput: { 'aria-label': '검색어 입력' } }}
        size="small"
        value={value.searchKeyword}
        onChange={(searchKeyword) =>
          onChange({
            ...value,
            searchKeyword,
          })
        }
        sx={{ flex: 1, minWidth: 220 }}
      />
    </SearchFilterBar>
  );
}
