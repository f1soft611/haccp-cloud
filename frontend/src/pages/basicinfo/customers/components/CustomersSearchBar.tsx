import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

export type CustomersSearchValue = {
  keyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

type CustomersSearchBarProps = {
  value: CustomersSearchValue;
  disabled?: boolean;
  onChange: (value: CustomersSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function CustomersSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: CustomersSearchBarProps) {
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
          거래처 등록
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
        placeholder="거래처코드, 거래처명, 대표자명, 사업자번호 검색"
        slotProps={{ htmlInput: { 'aria-label': '거래처코드, 거래처명, 대표자명, 사업자번호 검색' } }}
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
