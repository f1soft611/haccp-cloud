import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

export type EquipmentSearchValue = {
  keyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

type EquipmentSearchBarProps = {
  value: EquipmentSearchValue;
  disabled?: boolean;
  onChange: (value: EquipmentSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function EquipmentSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: EquipmentSearchBarProps) {
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
          설비 등록
        </Button>
      }
    >
      <AppTextField
        size="small"
        fullWidth
        label="검색어"
        placeholder="관리코드, 설비코드, 설비명, 구입처, 제조사"
        value={value.keyword}
        onChange={(keyword) =>
          onChange({
            ...value,
            keyword,
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
