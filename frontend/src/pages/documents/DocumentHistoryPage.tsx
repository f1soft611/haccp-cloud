import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listDocumentHistory } from '../../services/documents/documentsService';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';
import { DocumentHistoryGrid } from './components/DocumentHistoryGrid';

export function DocumentHistoryPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');

  const historyQuery = useQuery({
    queryKey: ['document-history', tenantCode],
    queryFn: () => listDocumentHistory(tenantCode),
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.history}
        description="문서 변경 이력을 확인합니다."
      />
      <DocumentHistoryGrid rows={historyQuery.data ?? []} />
    </Stack>
  );
}
