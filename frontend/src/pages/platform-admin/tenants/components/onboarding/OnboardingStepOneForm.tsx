import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AppDateField } from '../../../../../shared/components/forms/AppDateField';
import { AppTextField } from '../../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../../shared/components/forms/AppSelect';
import { APP_LABELS } from '../../../../../shared/constants/labels';
import { type TenantOnboardingFormData } from './types';
import type { PlanSummary } from '../../../../../services/platform-admin/planAccessService';

type OnboardingStepOneFormProps = {
  form: TenantOnboardingFormData;
  brnError: boolean;
  corporateNumberError: boolean;
  adminEmailError: boolean;
  registrationDateError: boolean;
  validationError: boolean;
  planOptions: PlanSummary[];
  planLoading: boolean;
  onFieldChange: (key: keyof TenantOnboardingFormData, value: string) => void;
  onBrnChange: (value: string) => void;
  onCorporateNumberChange: (value: string) => void;
  onNext: () => void;
};

export function OnboardingStepOneForm({
  form,
  brnError,
  corporateNumberError,
  adminEmailError,
  registrationDateError,
  validationError,
  planOptions,
  planLoading,
  onFieldChange,
  onBrnChange,
  onCorporateNumberChange,
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
              <AppTextField
                label={APP_LABELS.field.companyName}
                value={form.companyName}
                onChange={(nextValue) => onFieldChange('companyName', nextValue)}
                required
                fullWidth
              />
              <AppSelect
                label={APP_LABELS.field.planCode}
                value={form.planCode}
                onChange={(planCode) => onFieldChange('planCode', planCode)}
                disabled={planLoading || planOptions.length === 0}
                helperText={
                  planLoading
                    ? '플랜 목록을 불러오는 중입니다.'
                    : planOptions.length === 0
                      ? '사용 가능한 플랜이 없습니다.'
                      : undefined
                }
                required
                fullWidth
                emptyLabel="플랜을 선택하세요"
                options={planOptions.map((plan) => ({
                  value: plan.planCode,
                  label: plan.planName || plan.planCode,
                }))}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <AppTextField
                label={APP_LABELS.field.businessRegistrationNumber}
                placeholder="000-00-00000"
                value={form.businessRegistrationNumber}
                onChange={onBrnChange}
                error={brnError}
                helperText={
                  brnError
                    ? APP_LABELS.message.onboardingBrnFormatError
                    : undefined
                }
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 12 } }}
              />
              <AppTextField
                label={APP_LABELS.field.corporateNumber}
                placeholder="000000-0000000"
                value={form.corporateNumber}
                onChange={onCorporateNumberChange}
                error={corporateNumberError}
                helperText={
                  corporateNumberError
                    ? APP_LABELS.message.onboardingCorporateNumberFormatError
                    : '미입력 가능 (숫자 13자리)'
                }
                fullWidth
                slotProps={{ htmlInput: { maxLength: 14, inputMode: 'numeric' } }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <AppTextField
                label={APP_LABELS.field.representativeName}
                value={form.representativeName}
                onChange={(nextValue) =>
                  onFieldChange('representativeName', nextValue)
                }
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <AppTextField
                label={APP_LABELS.field.businessType}
                placeholder="예: 식품제조업"
                value={form.businessType}
                onChange={(nextValue) => onFieldChange('businessType', nextValue)}
                required
                fullWidth
              />
              <AppTextField
                label={APP_LABELS.field.businessCategory}
                placeholder="예: 즉석조리식품"
                value={form.businessCategory}
                onChange={(nextValue) =>
                  onFieldChange('businessCategory', nextValue)
                }
                required
                fullWidth
              />
            </Stack>
            <AppTextField
              label={APP_LABELS.field.address}
              value={form.address}
              onChange={(nextValue) => onFieldChange('address', nextValue)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <AppTextField
                label={APP_LABELS.field.phoneNumber}
                placeholder="02-0000-0000"
                value={form.phoneNumber}
                onChange={(nextValue) => onFieldChange('phoneNumber', nextValue)}
                fullWidth
              />
              <AppDateField
                label={APP_LABELS.field.registrationDate}
                value={form.registrationDate}
                onChange={(nextValue) =>
                  onFieldChange('registrationDate', nextValue)
                }
                error={registrationDateError}
                helperText={
                  registrationDateError
                    ? APP_LABELS.message.onboardingRegistrationDateFormatError
                    : undefined
                }
                fullWidth
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
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
            <AppTextField
              label={APP_LABELS.field.adminName}
              value={form.adminName}
              onChange={(nextValue) => onFieldChange('adminName', nextValue)}
              required
              fullWidth
            />
            <AppTextField
              label={APP_LABELS.field.adminEmail}
              type="email"
              value={form.adminEmail}
              onChange={(nextValue) => onFieldChange('adminEmail', nextValue)}
              error={adminEmailError}
              helperText={
                adminEmailError
                  ? APP_LABELS.message.onboardingAdminEmailFormatError
                  : undefined
              }
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
