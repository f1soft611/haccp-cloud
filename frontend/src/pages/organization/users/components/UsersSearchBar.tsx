import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
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
      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        sx={{ minWidth: 140 }}
      />
      <AppTextField
        size="small"
        fullWidth
        placeholder="이름, 이메일, 부서 검색"
        slotProps={{ htmlInput: { 'aria-label': '이름, 이메일, 부서 검색' } }}
        value={value.keyword}
        onChange={(keyword) =>
          onChange({
            ...value,
            keyword,
          })
        }
      />
    </SearchFilterBar>
  );
}
