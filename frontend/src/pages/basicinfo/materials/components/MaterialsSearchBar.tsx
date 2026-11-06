import { Box, Button, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import { CommonCodeSelect } from '../../../../shared/components/forms/CommonCodeSelect';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';

// 기존 -> 검색어만 / 변경 -> 품목계정(공통코드 ITEM_TYPE, '' = 전체) 추가
export type MaterialsSearchValue = {
  keyword: string;
  itemType: string;
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
      <TextField
        size="small"
        fullWidth
        label="검색어"
        placeholder="품목코드, 품목명, 규격, 품목계정"
        value={value.keyword}
        onChange={(event) =>
          onChange({
            ...value,
            keyword: event.target.value,
          })
        }
      />
    </SearchFilterBar>
  );
}
