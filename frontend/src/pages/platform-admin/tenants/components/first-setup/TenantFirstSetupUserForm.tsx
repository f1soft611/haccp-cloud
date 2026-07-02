import { Button, Stack, TextField } from '@mui/material';
import { APP_LABELS } from '../../../../../shared/constants/labels';

type TenantFirstSetupUserFormProps = {
  name: string;
  email: string;
  department: string;
  pending: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onSubmit: () => void;
};

export function TenantFirstSetupUserForm({
  name,
  email,
  department,
  pending,
  onNameChange,
  onEmailChange,
  onDepartmentChange,
  onSubmit,
}: TenantFirstSetupUserFormProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
      <TextField
        label={APP_LABELS.field.name}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <TextField
        label={APP_LABELS.field.email}
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <TextField
        label={APP_LABELS.field.department}
        value={department}
        onChange={(event) => onDepartmentChange(event.target.value)}
      />
      <Button variant="contained" onClick={onSubmit} disabled={pending}>
        {APP_LABELS.action.addUser}
      </Button>
    </Stack>
  );
}
