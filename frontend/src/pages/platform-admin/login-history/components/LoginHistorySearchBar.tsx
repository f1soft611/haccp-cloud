import { TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

const SEARCH_FIELD_OPTIONS = [
  { value: 'userId', label: '사용자 ID' },
  { value: 'userName', label: '사용자명' },
] as const;

const LOGIN_RESULT_OPTIONS = [
  { value: 'Y', label: '성공' },
  { value: 'N', label: '실패' },
] as const;

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
      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 120 }}
      />

      <TextField
        label="검색어"
        value={value.searchKeyword}
        onChange={(e) =>
          onChange({ ...value, searchKeyword: e.target.value })
        }
        size="small"
        sx={{ flex: 1, minWidth: 180 }}
      />

      <AppSelect
        size="small"
        label="로그인 결과"
        value={value.filterLoginResult}
        onChange={(filterLoginResult) => onChange({ ...value, filterLoginResult })}
        options={LOGIN_RESULT_OPTIONS}
        emptyLabel="전체"
        sx={{ minWidth: 160 }}
      />

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
