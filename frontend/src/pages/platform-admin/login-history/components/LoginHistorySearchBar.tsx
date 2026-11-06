import { MenuItem, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

type SearchField = 'userId' | 'userName';

export type LoginHistorySearchValue = {
  searchField: SearchField;
  searchKeyword: string;
  filterLoginResult: 'Y' | 'N' | '';
  filterFactoryCode: string;
  filterStartDt: string;
  filterEndDt: string;
};

export function LoginHistorySearchBar(props: {
  value: LoginHistorySearchValue;
  onChange: (next: LoginHistorySearchValue) => void;
  onSearch: () => void;
}) {
  const { value, onChange, onSearch } = props;

  return (
    <SearchFilterBar onSearch={onSearch}>
      {/* 기존 -> 칸 위 Typography 라벨 + Select */}
      {/* 변경 -> 칸 안 라벨을 쓰는 TextField select */}
      <TextField
        select
        label="검색 조건"
        value={value.searchField}
        onChange={(e) =>
          onChange({ ...value, searchField: e.target.value as SearchField })
        }
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="userId">사용자 ID</MenuItem>
        <MenuItem value="userName">사용자명</MenuItem>
      </TextField>

      <TextField
        label="검색어"
        value={value.searchKeyword}
        onChange={(e) =>
          onChange({ ...value, searchKeyword: e.target.value })
        }
        size="small"
        sx={{ flex: 1, minWidth: 180 }}
      />

      <TextField
        select
        label="로그인 결과"
        value={value.filterLoginResult}
        onChange={(e) =>
          onChange({
            ...value,
            filterLoginResult: e.target.value as 'Y' | 'N' | '',
          })
        }
        size="small"
        sx={{ minWidth: 160 }}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">전체</MenuItem>
        <MenuItem value="Y">성공</MenuItem>
        <MenuItem value="N">실패</MenuItem>
      </TextField>

      <TextField
        label="업체코드"
        value={value.filterFactoryCode}
        onChange={(e) =>
          onChange({ ...value, filterFactoryCode: e.target.value })
        }
        size="small"
        sx={{ minWidth: 160 }}
      />

      <TextField
        label="시작일"
        type="date"
        size="small"
        value={value.filterStartDt}
        onChange={(e) =>
          onChange({ ...value, filterStartDt: e.target.value })
        }
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 160 }}
      />

      <TextField
        label="종료일"
        type="date"
        size="small"
        value={value.filterEndDt}
        onChange={(e) => onChange({ ...value, filterEndDt: e.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 160 }}
      />
    </SearchFilterBar>
  );
}
