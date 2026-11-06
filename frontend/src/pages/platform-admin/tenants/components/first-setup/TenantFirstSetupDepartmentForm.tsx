import { Button, Stack } from '@mui/material';
import { AppTextField } from '../../../../../shared/components/forms/AppTextField';
import { APP_LABELS } from '../../../../../shared/constants/labels';

type TenantFirstSetupDepartmentFormProps = {
  departmentName: string;
  pending: boolean;
  onDepartmentNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function TenantFirstSetupDepartmentForm({
  departmentName,
  pending,
  onDepartmentNameChange,
  onSubmit,
}: TenantFirstSetupDepartmentFormProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
      <AppTextField
        label={APP_LABELS.field.departmentName}
        value={departmentName}
        onChange={onDepartmentNameChange}
      />
      <Button variant="contained" onClick={onSubmit} disabled={pending}>
        {APP_LABELS.action.addDepartment}
      </Button>
    </Stack>
  );
}
