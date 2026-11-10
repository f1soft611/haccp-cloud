import { AppDateField } from '../../../../shared/components/forms/AppDateField';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
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
      <AppSelect
        size="small"
        label="로그인 결과"
        value={value.filterLoginResult}
        onChange={(filterLoginResult) => onChange({ ...value, filterLoginResult })}
        options={LOGIN_RESULT_OPTIONS}
        emptyLabel="전체"
        sx={{ minWidth: 160 }}
      />

      <AppTextField
        label="업체코드"
        value={value.filterFactoryCode}
        onChange={(filterFactoryCode) =>
          onChange({ ...value, filterFactoryCode })
        }
        size="small"
        sx={{ minWidth: 160 }}
      />

      <AppDateField
        label="시작일"
        size="small"
        value={value.filterStartDt}
        onChange={(filterStartDt) =>
          onChange({ ...value, filterStartDt })
        }
        sx={{ minWidth: 160 }}
      />

      <AppDateField
        label="종료일"
        size="small"
        value={value.filterEndDt}
        onChange={(filterEndDt) => onChange({ ...value, filterEndDt })}
        sx={{ minWidth: 160 }}
      />

      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 120 }}
      />

      <AppTextField
        placeholder="검색어 입력"
        slotProps={{ htmlInput: { 'aria-label': '검색어 입력' } }}
        value={value.searchKeyword}
        onChange={(searchKeyword) =>
          onChange({ ...value, searchKeyword })
        }
        size="small"
        sx={{ flex: 1, minWidth: 180 }}
      />
    </SearchFilterBar>
  );
}