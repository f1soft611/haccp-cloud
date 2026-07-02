import {
  Alert,
  Box,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  issueTenantCode,
  listSampleTenants,
} from '../../../services/organization/tenantService';
import { listPlanSummaries } from '../../../services/platform-admin/planAccessService';
import type { IssueTenantCodeRequest } from '../../../services/organization/tenantService';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { APP_LABELS } from '../../../shared/constants/labels';
import { OnboardingStepOneForm } from './components/onboarding/OnboardingStepOneForm';
import { OnboardingStepTwoConfirm } from './components/onboarding/OnboardingStepTwoConfirm';
import { OnboardingStepThreeComplete } from './components/onboarding/OnboardingStepThreeComplete';
import { OnboardingHistorySection } from './components/onboarding/OnboardingHistorySection';
import {
  EMPTY_ONBOARDING_FORM,
  type TenantOnboardingFormData,
} from './components/onboarding/types';

const BRN_REGEX = /^\d{3}-\d{2}-\d{5}$/;
const CORPORATE_NUMBER_REGEX = /^\d{13}$/;

function formatBrn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function resolveIssueTenantCodeErrorMessage(error: unknown): string {
  const rawMessage = extractApiErrorMessage(
    error,
    APP_LABELS.message.onboardingFailed,
  );
  const normalizedMessage = rawMessage.toLowerCase();
  const compactMessage = normalizedMessage.replace(/\s+/g, '');

  if (
    normalizedMessage.includes('tb_tenant_admin_email_key') ||
    normalizedMessage.includes('admin_email') ||
    compactMessage.includes('업체관리자이메일')
  ) {
    return APP_LABELS.message.onboardingDuplicateAdminEmail;
  }

  if (
    normalizedMessage.includes('duplicate_brn') ||
    normalizedMessage.includes('businessregistrationnumber') ||
    compactMessage.includes('이미등록된사업자번호')
  ) {
    return APP_LABELS.message.onboardingDuplicateBrn;
  }

  return rawMessage;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<TenantOnboardingFormData>(
    EMPTY_ONBOARDING_FORM,
  );
  const [brnError, setBrnError] = useState(false);
  const [corporateNumberError, setCorporateNumberError] = useState(false);
  const [validationError, setValidationError] = useState(false);

  const sampleTenantsQuery = useQuery({
    queryKey: ['sample-tenants'],
    queryFn: listSampleTenants,
  });

  const planSummariesQuery = useQuery({
    queryKey: ['platform-admin', 'plans', 'summaries'],
    queryFn: listPlanSummaries,
  });

  const mutation = useMutation({
    mutationFn: (payload: IssueTenantCodeRequest) => issueTenantCode(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sample-tenants'] });
      setStep(3);
    },
  });

  const issueErrorMessage = mutation.isError
    ? resolveIssueTenantCodeErrorMessage(mutation.error)
    : null;

  const setField = (key: keyof TenantOnboardingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBrnChange = (raw: string) => {
    const formatted = formatBrn(raw);
    setField('businessRegistrationNumber', formatted);
    setBrnError(false);
  };

  const handleCorporateNumberChange = (raw: string) => {
    setField('corporateNumber', raw);
    setCorporateNumberError(false);
  };

  const handleStep1Next = () => {
    const required: (keyof TenantOnboardingFormData)[] = [
      'companyName',
      'planCode',
      'businessRegistrationNumber',
      'businessType',
      'businessCategory',
      'adminName',
      'adminEmail',
    ];
    const hasEmpty = required.some((k) => !form[k].trim());
    const brnInvalid = !BRN_REGEX.test(form.businessRegistrationNumber);
    const normalizedCorporateNumber = form.corporateNumber.replace(/\D/g, '');
    const corporateNumberInvalid =
      normalizedCorporateNumber.length > 0 &&
      !CORPORATE_NUMBER_REGEX.test(normalizedCorporateNumber);

    if (hasEmpty) {
      setValidationError(true);
      return;
    }
    if (brnInvalid) {
      setBrnError(true);
      return;
    }
    if (corporateNumberInvalid) {
      setCorporateNumberError(true);
      return;
    }
    setValidationError(false);
    setBrnError(false);
    setCorporateNumberError(false);
    setStep(2);
  };

  const handleIssue = () => {
    mutation.mutate({
      companyName: form.companyName.trim(),
      planCode: form.planCode.trim(),
      businessRegistrationNumber: form.businessRegistrationNumber.trim(),
      corporateNumber: form.corporateNumber.trim(),
      representativeName: form.representativeName.trim(),
      businessType: form.businessType.trim(),
      businessCategory: form.businessCategory.trim(),
      address: form.address.trim(),
      phoneNumber: form.phoneNumber.trim(),
      registrationDate: form.registrationDate.trim(),
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
    });
  };

  const handleReset = () => {
    setForm(EMPTY_ONBOARDING_FORM);
    setBrnError(false);
    setCorporateNumberError(false);
    setValidationError(false);
    mutation.reset();
    setStep(1);
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {APP_LABELS.pageTitle.onboarding}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {APP_LABELS.message.onboardingDescription}
        </Typography>
      </Box>

      <Stepper activeStep={step - 1} alternativeLabel>
        {APP_LABELS.onboarding.wizardSteps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 1 && (
        <OnboardingStepOneForm
          form={form}
          brnError={brnError}
          corporateNumberError={corporateNumberError}
          validationError={validationError}
          planOptions={planSummariesQuery.data ?? []}
          planLoading={planSummariesQuery.isPending}
          onFieldChange={setField}
          onBrnChange={handleBrnChange}
          onCorporateNumberChange={handleCorporateNumberChange}
          onNext={handleStep1Next}
        />
      )}

      {step === 1 && planSummariesQuery.isError ? (
        <Alert severity="warning">
          플랜 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </Alert>
      ) : null}

      {step === 2 && (
        <OnboardingStepTwoConfirm
          form={form}
          issueErrorMessage={issueErrorMessage}
          isPending={mutation.isPending}
          onEdit={() => {
            mutation.reset();
            setStep(1);
          }}
          onIssue={handleIssue}
        />
      )}

      {step === 3 && mutation.isSuccess && (
        <OnboardingStepThreeComplete
          result={mutation.data}
          onReset={handleReset}
          onGoDashboard={() => navigate('/dashboard')}
        />
      )}

      <OnboardingHistorySection
        loading={sampleTenantsQuery.isPending}
        error={sampleTenantsQuery.isError}
        rows={sampleTenantsQuery.data ?? []}
      />
    </Stack>
  );
}
