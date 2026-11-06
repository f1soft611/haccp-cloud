import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const SEARCH_FIELD_OPTIONS = [
  { value: 'code', label: '권한 코드' },
  { value: 'name', label: '권한명' },
  { value: 'description', label: '설명' },
] as const;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '활성' },
  { value: 'N', label: '비활성' },
] as const;

export type AuthoritySearchValue = {
  searchField: 'code' | 'name' | 'description';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

export function PlatformAuthoritySearchBar(props: {
  value: AuthoritySearchValue;
  disabled?: boolean;
  showCreateButton?: boolean;
  onChange: (next: AuthoritySearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
}) {
  const {
    value,
    disabled = false,
    showCreateButton = true,
    onChange,
    onSearch,
    onCreate,
  } = props;

  return (
    <SearchFilterBar
      onSearch={onSearch}
      disabled={disabled}
      actions={
        showCreateButton ? (
          <Button variant="contained" onClick={onCreate} disabled={disabled}>
            + 권한 추가
          </Button>
        ) : null
      }
    >
      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 140 }}
      />

      <AppTextField
        label="검색어"
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

      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        sx={{ minWidth: 120 }}
      />
    </SearchFilterBar>
  );
}
