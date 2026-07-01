import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  type PlatformTenantSearchValue,
  type SearchField,
  type StatusFilter,
  type OnboardingStatusFilter,
} from '../types';

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
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems="flex-end"
      >
        <Box sx={{ minWidth: 130 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            검색 조건
          </Typography>
          <Select
            value={value.searchField}
            size="small"
            fullWidth
            onChange={(event) =>
              onChange({
                ...value,
                searchField: event.target.value as SearchField,
              })
            }
          >
            <MenuItem value="tenantCode">업체코드</MenuItem>
            <MenuItem value="companyName">업체명</MenuItem>
            <MenuItem value="adminName">관리자명</MenuItem>
          </Select>
        </Box>

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
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
        />

        <Box sx={{ minWidth: 120 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            상태
          </Typography>
          <Select
            value={value.status}
            size="small"
            fullWidth
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value as StatusFilter,
              })
            }
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="ACTIVE">활성</MenuItem>
            <MenuItem value="INACTIVE">비활성</MenuItem>
          </Select>
        </Box>

        <Box sx={{ minWidth: 170 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            온보딩 상태
          </Typography>
          <Select
            value={value.onboardingStatus}
            size="small"
            fullWidth
            onChange={(event) =>
              onChange({
                ...value,
                onboardingStatus: event.target.value as OnboardingStatusFilter,
              })
            }
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="EMAIL_QUEUED">메일 발송 대기</MenuItem>
            <MenuItem value="EMAIL_SENT">메일 발송 완료</MenuItem>
            <MenuItem value="EMAIL_VERIFIED">메일 인증 완료</MenuItem>
            <MenuItem value="FIRST_SETUP_COMPLETED">초기 설정 완료</MenuItem>
            <MenuItem value="ACTIVE">온보딩 완료</MenuItem>
          </Select>
        </Box>

        <Button variant="contained" onClick={onSearch} disabled={disabled}>
          조회
        </Button>

        <Button
          variant="contained"
          onClick={onClickOnboarding}
          sx={{ ml: { md: 'auto' } }}
        >
          신규 온보딩
        </Button>
      </Stack>
    </Paper>
  );
}
