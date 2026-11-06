import { Button, TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import { type PlatformTenantSearchValue } from '../types';

const SEARCH_FIELD_OPTIONS = [
  { value: 'tenantCode', label: '업체코드' },
  { value: 'companyName', label: '업체명' },
  { value: 'adminName', label: '관리자명' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
] as const;

const ONBOARDING_STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'EMAIL_QUEUED', label: '메일 발송 대기' },
  { value: 'EMAIL_SENT', label: '메일 발송 완료' },
  { value: 'EMAIL_VERIFIED', label: '메일 인증 완료' },
  { value: 'FIRST_SETUP_COMPLETED', label: '초기 설정 완료' },
  { value: 'ACTIVE', label: '온보딩 완료' },
] as const;

type PlatformTenantSearchBarProps = {
  value: PlatformTenantSearchValue;
  disabled?: boolean;
  onChange: (next: PlatformTenantSearchValue) => void;
  onSearch: () => void;
  onClickOnboarding: () => void;
};

export function PlatformTenantSearchBar({
  value,
  disabled = false,
  onChange,
  onSearch,
  onClickOnboarding,
}: PlatformTenantSearchBarProps) {
  return (
    <SearchFilterBar
      onSearch={onSearch}
      disabled={disabled}
      actions={
        <Button variant="contained" onClick={onClickOnboarding}>
          신규 온보딩
        </Button>
      }
    >
      <AppSelect
        size="small"
        label="검색 조건"
        value={value.searchField}
        onChange={(searchField) => onChange({ ...value, searchField })}
        options={SEARCH_FIELD_OPTIONS}
        sx={{ minWidth: 130 }}
      />

      <TextField
        size="small"
        label="검색어"
        fullWidth
        value={value.searchKeyword}
        onChange={(event) =>
          onChange({
            ...value,
            searchKeyword: event.target.value,
          })
        }
        sx={{ flex: 1 }}
      />

      <AppSelect
        size="small"
        label="상태"
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        options={STATUS_OPTIONS}
        sx={{ minWidth: 120 }}
      />

      <AppSelect
        size="small"
        label="온보딩 상태"
        value={value.onboardingStatus}
        onChange={(onboardingStatus) => onChange({ ...value, onboardingStatus })}
        options={ONBOARDING_STATUS_OPTIONS}
        sx={{ minWidth: 170 }}
      />
    </SearchFilterBar>
  );
}
