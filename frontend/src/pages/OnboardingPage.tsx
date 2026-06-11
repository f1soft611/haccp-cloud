import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { onboardTenant } from '../services/tenantService';
import { APP_LABELS } from '../shared/ui/labels';

export function OnboardingPage() {
  const [tenantCode, setTenantCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const mutation = useMutation({
    mutationFn: onboardTenant,
    onSuccess: () => {
      setTenantCode('');
      setCompanyName('');
      setAdminName('');
      setAdminEmail('');
    },
  });

  const handleSubmit = () => {
    mutation.mutate({ tenantCode, companyName, adminName, adminEmail });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 640 }}>
      <Stack spacing={2}>
        <Typography variant="h4">{APP_LABELS.pageTitle.onboarding}</Typography>
        <Typography color="text.secondary">
          {APP_LABELS.message.onboardingDescription}
        </Typography>
        {mutation.isSuccess && (
          <Alert severity="success">
            {APP_LABELS.message.onboardingSuccess}
          </Alert>
        )}
        {mutation.isError && (
          <Alert severity="error">{APP_LABELS.message.onboardingFailed}</Alert>
        )}
        <TextField
          label={APP_LABELS.field.tenantCode}
          value={tenantCode}
          onChange={(event) => setTenantCode(event.target.value)}
        />
        <TextField
          label={APP_LABELS.field.companyName}
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
        />
        <TextField
          label={APP_LABELS.field.adminName}
          value={adminName}
          onChange={(event) => setAdminName(event.target.value)}
        />
        <TextField
          label={APP_LABELS.field.adminEmail}
          value={adminEmail}
          onChange={(event) => setAdminEmail(event.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {APP_LABELS.action.createTenant}
        </Button>
      </Stack>
    </Paper>
  );
}
