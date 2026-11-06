import { Button, Paper, Stack, TextField } from '@mui/material';
import { type DocumentStatus } from '../../../services/documents/documentsService';
import { AppSelect } from '../../../shared/components/forms/AppSelect';
import {
  APP_LABELS,
  getDocumentStatusLabel,
} from '../../../shared/constants/labels';

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'DRAFT', label: getDocumentStatusLabel('DRAFT') },
  { value: 'ACTIVE', label: getDocumentStatusLabel('ACTIVE') },
];

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
        <AppSelect
          label={APP_LABELS.field.status}
          value={value.status}
          onChange={(status) => onChange({ ...value, status })}
          options={STATUS_OPTIONS}
        />
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {APP_LABELS.action.addTemplate}
        </Button>
      </Stack>
    </Paper>
  );
}
