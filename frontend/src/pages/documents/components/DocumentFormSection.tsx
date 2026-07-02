import { Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { type DocumentStatus } from '../../../services/documents/documentsService';
import {
  APP_LABELS,
  getDocumentStatusLabel,
} from '../../../shared/constants/labels';

export type DocumentFormValue = {
  title: string;
  category: string;
  content: string;
  status: DocumentStatus;
};

export function DocumentFormSection(props: {
  value: DocumentFormValue;
  submitting?: boolean;
  onChange: (next: DocumentFormValue) => void;
  onSubmit: () => void;
}) {
  const { value, submitting = false, onChange, onSubmit } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <TextField
          label={APP_LABELS.field.title}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
        <TextField
          label={APP_LABELS.field.category}
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
        />
        <TextField
          label={APP_LABELS.field.content}
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          multiline
          minRows={3}
        />
        <TextField
          select
          label={APP_LABELS.field.status}
          value={value.status}
          onChange={(e) =>
            onChange({ ...value, status: e.target.value as DocumentStatus })
          }
        >
          <MenuItem value="DRAFT">{getDocumentStatusLabel('DRAFT')}</MenuItem>
          <MenuItem value="ACTIVE">{getDocumentStatusLabel('ACTIVE')}</MenuItem>
        </TextField>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {APP_LABELS.action.addTemplate}
        </Button>
      </Stack>
    </Paper>
  );
}
