import { Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import {
  createDocument,
  listDocuments,
  type DocumentStatus,
} from '../../services/documents/documentsService';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';
import {
  DocumentFormSection,
  type DocumentFormValue,
} from './components/DocumentFormSection';
import { DocumentGrid } from './components/DocumentGrid';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const userId = useAuthStore((state) => state.userId || 'tenant_admin');

  const [formValue, setFormValue] = useState<DocumentFormValue>({
    title: '',
    category: 'CCP',
    content: '',
    status: 'DRAFT' as DocumentStatus,
  });

  const query = useQuery({
    queryKey: ['documents', tenantCode],
    queryFn: () => listDocuments(tenantCode),
  });

  const mutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      setFormValue({
        title: '',
        category: 'CCP',
        content: '',
        status: 'DRAFT',
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', tenantCode],
      });
      void queryClient.invalidateQueries({
        queryKey: ['document-history', tenantCode],
      });
      void queryClient.invalidateQueries({
        queryKey: ['dashboard', tenantCode],
      });
    },
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.documents}
        description="문서 템플릿을 조회하고 관리합니다."
      />

      <DocumentFormSection
        value={formValue}
        submitting={mutation.isPending}
        onChange={setFormValue}
        onSubmit={() =>
          mutation.mutate({
            tenantCode,
            title: formValue.title,
            category: formValue.category,
            content: formValue.content,
            status: formValue.status,
            updatedBy: userId,
          })
        }
      />

      <DocumentGrid rows={query.data ?? []} />
    </Stack>
  );
}
