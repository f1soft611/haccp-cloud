import {
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createDocument,
  listDocuments,
  type DocumentStatus,
} from '../services/documentsService';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS, getDocumentStatusLabel } from '../shared/ui/labels';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const userId = useAuthStore((state) => state.userId || 'tenant_admin');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CCP');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('DRAFT');

  const query = useQuery({
    queryKey: ['documents', tenantCode],
    queryFn: () => listDocuments(tenantCode),
  });

  const mutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      setTitle('');
      setCategory('CCP');
      setContent('');
      setStatus('DRAFT');
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
      <Typography variant="h4">{APP_LABELS.pageTitle.documents}</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <TextField
            label={APP_LABELS.field.title}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            label={APP_LABELS.field.category}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <TextField
            label={APP_LABELS.field.content}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            multiline
            minRows={3}
          />
          <TextField
            select
            label={APP_LABELS.field.status}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as DocumentStatus)
            }
          >
            <MenuItem value="DRAFT">{getDocumentStatusLabel('DRAFT')}</MenuItem>
            <MenuItem value="ACTIVE">
              {getDocumentStatusLabel('ACTIVE')}
            </MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={() =>
              mutation.mutate({
                tenantCode,
                title,
                category,
                content,
                status,
                updatedBy: userId,
              })
            }
            disabled={mutation.isPending}
          >
            {APP_LABELS.action.addTemplate}
          </Button>
        </Stack>
      </Paper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{APP_LABELS.table.title}</TableCell>
            <TableCell>{APP_LABELS.table.category}</TableCell>
            <TableCell>{APP_LABELS.table.status}</TableCell>
            <TableCell>{APP_LABELS.table.version}</TableCell>
            <TableCell>{APP_LABELS.table.updatedBy}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(query.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{getDocumentStatusLabel(row.status)}</TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell>{row.updatedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
