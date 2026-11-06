import { Button, MenuItem, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
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
      <TextField
        size="small"
        fullWidth
        label="검색어"
        placeholder="관리코드, 설비코드, 설비명, 구입처, 제조사"
        value={value.keyword}
        onChange={(event) =>
          onChange({
            ...value,
            keyword: event.target.value,
          })
        }
      />

      <TextField
        select
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(event) =>
          onChange({
            ...value,
            filterActive: event.target
              .value as EquipmentSearchValue['filterActive'],
          })
        }
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="all">전체</MenuItem>
        <MenuItem value="Y">사용</MenuItem>
        <MenuItem value="N">미사용</MenuItem>
      </TextField>
    </SearchFilterBar>
  );
}
