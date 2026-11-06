import { Button, MenuItem, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

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

      <TextField
        select
        size="small"
        label="상태"
        value={value.filterActive}
        onChange={(event) =>
          onChange({
            ...value,
            filterActive: event.target
              .value as UsersSearchValue['filterActive'],
          })
        }
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="all">전체</MenuItem>
        <MenuItem value="Y">활성</MenuItem>
        <MenuItem value="N">비활성</MenuItem>
      </TextField>
    </SearchFilterBar>
  );
}
