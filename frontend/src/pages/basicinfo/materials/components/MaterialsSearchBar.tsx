import { Box, Button } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import { CommonCodeSelect } from '../../../../shared/components/forms/CommonCodeSelect';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

export type MaterialsSearchValue = {
  keyword: string;
  itemType: string;
  filterActive: '' | 'Y' | 'N';
};

type MaterialsSearchBarProps = {
  value: MaterialsSearchValue;
  disabled?: boolean;
  onChange: (value: MaterialsSearchValue) => void;
  onSearch: () => void;
  onCreate: () => void;
};

export function MaterialsSearchBar({
  value,
  disabled,
  onChange,
  onSearch,
  onCreate,
}: MaterialsSearchBarProps) {
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
          품목 등록
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
      <Box sx={{ minWidth: { md: 180 } }}>
        <CommonCodeSelect
          groupCode={COMMON_CODE_GROUP.ITEM_TYPE}
          label="품목계정"
          emptyLabel="전체"
          size="small"
          fullWidth
          value={value.itemType}
          onChange={(itemType) => onChange({ ...value, itemType })}
        />
      </Box>
      <AppTextField
        size="small"
        fullWidth
        placeholder="품목코드, 품목명, 규격, 품목계정 검색"
        slotProps={{ htmlInput: { 'aria-label': '품목코드, 품목명, 규격, 품목계정 검색' } }}
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
