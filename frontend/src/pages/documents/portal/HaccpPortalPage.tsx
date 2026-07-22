import { Alert, Stack } from '@mui/material';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { HaccpPortalGrid } from './components/HaccpPortalGrid';
import { useHaccpPortalPage } from './hooks/useHaccpPortalPage';

export function HaccpPortalPage() {
  const { documentsQuery, sections } = useHaccpPortalPage();

  return (
    <Stack spacing={2} data-testid="haccp-portal-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 문서포탈"
        description="관리자용 분류별 문서 목록을 확인합니다."
      />

      {documentsQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            documentsQuery.error,
            'HACCP 문서포탈 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <HaccpPortalGrid sections={sections} loading={documentsQuery.isLoading} />
    </Stack>
  );
}
