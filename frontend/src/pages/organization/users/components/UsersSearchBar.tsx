import { Button, TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '활성' },
  { value: 'N', label: '비활성' },
] as const;

export type UsersSearchValue = {
  keyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

type UsersSearchBarProps = {
  value: UsersSearchValue;
  disabled?: boolean;
  onChange: (value: UsersSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function UsersSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: UsersSearchBarProps) {
  return (
    <SearchFilterBar
      onSearch={onSearch}
      disabled={disabled}
      actions={
        <Button
          variant="contained"
          onClick={onCreate}
          disabled={disabled}
          sx={{ minWidth: 120 }}
        >
          사용자 등록
        </Button>
      }
    >
      <TextField
        size="small"
        fullWidth
        label="검색어"
        placeholder="이름, 이메일, 부서"
        value={value.keyword}
        onChange={(event) =>
          onChange({
            ...value,
            keyword: event.target.value,
          })
        }
      />

      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        sx={{ minWidth: 140 }}
      />
    </SearchFilterBar>
  );
}
