import { Alert, Stack } from '@mui/material';
import { AppTextField } from '../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../shared/components/forms/AppSelect';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { SearchFilterBar } from '../../../shared/components/forms/SearchFilterBar';
import { APP_LABELS } from '../../../shared/constants/labels';
import { HaccpPortalGrid } from './components/HaccpPortalGrid';
import { useHaccpPortalPage } from './hooks/useHaccpPortalPage';
import { useWorkCycleOptions } from '../../../shared/hooks/useWorkCycleOptions';

export function HaccpPortalPage() {
  const { documentsQuery, search, setSearch, onSearch, categoryOptions, rows } =
    useHaccpPortalPage();

  const cycleOptions = useWorkCycleOptions();

  return (
    <Stack spacing={2} data-testid="haccp-portal-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 문서포탈"
        description="관리자용 분류별 문서 목록을 확인합니다."
      />

      {/* 기존 -> 검색필터 없음 / 변경 -> 업무분류·등록주기·키워드 검색필터 */}
      <SearchFilterBar onSearch={onSearch}>
        <AppSelect
          size="small"
          label="업무분류"
          value={search.category}
          onChange={(category) => setSearch({ ...search, category })}
          options={[
            { value: 'ALL', label: '전체' },
            ...categoryOptions.map((category) => ({ value: category, label: category })),
          ]}
          sx={{ minWidth: 180 }}
        />

        <AppSelect
          size="small"
          label="작성주기"
          value={search.cycle}
          onChange={(cycle) => setSearch({ ...search, cycle })}
          options={[
            { value: 'ALL', label: '전체' },
            ...cycleOptions.map((option) => ({ value: option.code, label: option.name })),
          ]}
          sx={{ minWidth: 180 }}
        />

        <AppTextField
          size="small"
          placeholder="구분명, 담당자 검색"
          slotProps={{ htmlInput: { 'aria-label': '구분명, 담당자 검색' } }}
          value={search.keyword}
          onChange={(keyword) =>
            setSearch({ ...search, keyword })
          }
          sx={{ flex: 1, minWidth: 260 }}
        />
      </SearchFilterBar>

      {documentsQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            documentsQuery.error,
            'HACCP 문서포탈 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <HaccpPortalGrid rows={rows} loading={documentsQuery.isLoading} />
    </Stack>
  );
}
