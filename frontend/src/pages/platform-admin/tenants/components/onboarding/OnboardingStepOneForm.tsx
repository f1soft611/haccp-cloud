import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { APP_LABELS } from '../../../../../shared/constants/labels';
import { type TenantOnboardingFormData } from './types';

type OnboardingStepOneFormProps = {
  form: TenantOnboardingFormData;
  brnError: boolean;
  validationError: boolean;
  onFieldChange: (key: keyof TenantOnboardingFormData, value: string) => void;
  onBrnChange: (value: string) => void;
  onNext: () => void;
};

export function OnboardingStepOneForm({
  form,
  brnError,
  validationError,
  onFieldChange,
  onBrnChange,
  onNext,
}: OnboardingStepOneFormProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={3}>
        {validationError && (
          <Alert severity="error">{APP_LABELS.message.onboardingFailed}</Alert>
        )}

        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            {APP_LABELS.onboarding.sectionCompanyInfo}
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label={APP_LABELS.field.companyName}
                value={form.companyName}
                onChange={(e) => onFieldChange('companyName', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label={APP_LABELS.field.businessRegistrationNumber}
                placeholder="000-00-00000"
                value={form.businessRegistrationNumber}
                onChange={(e) => onBrnChange(e.target.value)}
                error={brnError}
                helperText={
                  brnError
                    ? APP_LABELS.message.onboardingBrnFormatError
                    : undefined
                }
                required
                fullWidth
                inputProps={{ maxLength: 12 }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={APP_LABELS.field.corporateNumber}
                value={form.corporateNumber}
                onChange={(e) =>
                  onFieldChange('corporateNumber', e.target.value)
                }
                required
                fullWidth
              />
              <TextField
                label={APP_LABELS.field.representativeName}
                value={form.representativeName}
                onChange={(e) =>
                  onFieldChange('representativeName', e.target.value)
                }
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={APP_LABELS.field.businessType}
                placeholder="예: 식품제조업"
                value={form.businessType}
                onChange={(e) => onFieldChange('businessType', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label={APP_LABELS.field.businessCategory}
                placeholder="예: 즉석조리식품"
                value={form.businessCategory}
                onChange={(e) =>
                  onFieldChange('businessCategory', e.target.value)
                }
                required
                fullWidth
              />
            </Stack>
            <TextField
              label={APP_LABELS.field.address}
              value={form.address}
              onChange={(e) => onFieldChange('address', e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={APP_LABELS.field.phoneNumber}
                placeholder="02-0000-0000"
                value={form.phoneNumber}
                onChange={(e) => onFieldChange('phoneNumber', e.target.value)}
                fullWidth
              />
              <TextField
                label={APP_LABELS.field.registrationDate}
                type="date"
                value={form.registrationDate}
                onChange={(e) =>
                  onFieldChange('registrationDate', e.target.value)
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            {APP_LABELS.onboarding.sectionAdminInfo}
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label={APP_LABELS.field.adminName}
              value={form.adminName}
              onChange={(e) => onFieldChange('adminName', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={APP_LABELS.field.adminEmail}
              type="email"
              value={form.adminEmail}
              onChange={(e) => onFieldChange('adminEmail', e.target.value)}
              required
              fullWidth
            />
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" onClick={onNext}>
            {APP_LABELS.action.nextStep}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
