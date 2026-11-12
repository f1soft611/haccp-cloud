import { Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

export type EquipmentSearchValue = {
  keyword: string;
  filterActive: '' | 'Y' | 'N';
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
      <AppSelect
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(filterActive) => onChange({ ...value, filterActive })}
        options={ACTIVE_FILTER_OPTIONS}
        emptyLabel="전체"
        sx={{ minWidth: 140 }}
      />
      <AppTextField
        size="small"
        fullWidth
        placeholder="관리코드, 설비코드, 설비명, 구입처, 제조사 검색"
        slotProps={{ htmlInput: { 'aria-label': '관리코드, 설비코드, 설비명, 구입처, 제조사 검색' } }}
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
