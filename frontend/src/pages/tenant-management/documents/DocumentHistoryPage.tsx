import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listDocumentHistory } from '../../../services/common/documentsService';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import { APP_LABELS } from '../../../shared/constants/labels';

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
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{APP_LABELS.table.title}</TableCell>
            <TableCell>{APP_LABELS.table.version}</TableCell>
            <TableCell>{APP_LABELS.table.changedBy}</TableCell>
            <TableCell>{APP_LABELS.table.changedAt}</TableCell>
            <TableCell>{APP_LABELS.table.summary}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(historyQuery.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell>{row.changedBy}</TableCell>
              <TableCell>{new Date(row.changedAt).toLocaleString()}</TableCell>
              <TableCell>{row.summary}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
