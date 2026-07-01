import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { APP_LABELS } from '../../../../../shared/constants/labels';
import { type IssueTenantCodeResponse } from '../../../../../services/organization/tenantService';
import { OnboardingLabelValue } from './OnboardingLabelValue';

type OnboardingStepThreeCompleteProps = {
  result: IssueTenantCodeResponse;
  onReset: () => void;
  onGoDashboard: () => void;
};

export function OnboardingStepThreeComplete({
  result,
  onReset,
  onGoDashboard,
}: OnboardingStepThreeCompleteProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2} alignItems="center">
        <Alert severity="success" sx={{ width: '100%' }}>
          {APP_LABELS.message.onboardingSuccess}
        </Alert>
        <Typography variant="h6" fontWeight={700}>
          {APP_LABELS.onboarding.completeTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {APP_LABELS.onboarding.completeDescription}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            width: '100%',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.06)'
                : 'grey.50',
          }}
        >
          <Stack spacing={0.5}>
            <OnboardingLabelValue
              label={APP_LABELS.onboarding.issuedTenantCode}
              value={result.tenantCode}
            />
            <OnboardingLabelValue
              label={APP_LABELS.field.companyName}
              value={result.companyName}
            />
            <OnboardingLabelValue
              label={APP_LABELS.field.adminEmail}
              value={result.adminEmail}
            />
            <OnboardingLabelValue
              label={APP_LABELS.onboarding.mailDispatchStatus}
              value={
                APP_LABELS.onboarding.mailStatus[result.mailDispatchStatus]
              }
            />
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="outlined" onClick={onReset}>
            {APP_LABELS.action.newTenantRegistration}
          </Button>
          <Button variant="contained" onClick={onGoDashboard}>
            {APP_LABELS.action.goToDashboard}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
