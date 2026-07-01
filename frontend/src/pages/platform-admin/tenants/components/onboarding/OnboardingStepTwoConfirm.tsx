import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { APP_LABELS } from '../../../../../shared/constants/labels';
import { OnboardingLabelValue } from './OnboardingLabelValue';
import { type TenantOnboardingFormData } from './types';

type OnboardingStepTwoConfirmProps = {
  form: TenantOnboardingFormData;
  issueErrorMessage: string | null;
  isPending: boolean;
  onEdit: () => void;
  onIssue: () => void;
};

const confirmCardSx = {
  p: 2,
  borderRadius: 2,
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'grey.50',
};

export function OnboardingStepTwoConfirm({
  form,
  issueErrorMessage,
  isPending,
  onEdit,
  onIssue,
}: OnboardingStepTwoConfirmProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {APP_LABELS.onboarding.confirmTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {APP_LABELS.onboarding.confirmDescription}
        </Typography>

        {issueErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {issueErrorMessage}
          </Alert>
        )}

        <Paper variant="outlined" sx={confirmCardSx}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ mb: 1, display: 'block' }}
          >
            {APP_LABELS.onboarding.sectionCompanyInfo}
          </Typography>
          <OnboardingLabelValue
            label={APP_LABELS.field.companyName}
            value={form.companyName}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.businessRegistrationNumber}
            value={form.businessRegistrationNumber}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.corporateNumber}
            value={form.corporateNumber}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.representativeName}
            value={form.representativeName}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.businessType}
            value={form.businessType}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.businessCategory}
            value={form.businessCategory}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.address}
            value={form.address}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.phoneNumber}
            value={form.phoneNumber}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.registrationDate}
            value={form.registrationDate}
          />
        </Paper>

        <Paper variant="outlined" sx={confirmCardSx}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ mb: 1, display: 'block' }}
          >
            {APP_LABELS.onboarding.sectionAdminInfo}
          </Typography>
          <OnboardingLabelValue
            label={APP_LABELS.field.adminName}
            value={form.adminName}
          />
          <OnboardingLabelValue
            label={APP_LABELS.field.adminEmail}
            value={form.adminEmail}
          />
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onEdit} disabled={isPending}>
            {APP_LABELS.action.edit}
          </Button>
          <Button variant="contained" onClick={onIssue} disabled={isPending}>
            {APP_LABELS.action.issueTenantCode}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
