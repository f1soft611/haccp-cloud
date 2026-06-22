import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  issueTenantCode,
  listSampleTenants,
} from '../../../services/tenant/tenantService';
import type { IssueTenantCodeRequest } from '../../../services/tenant/tenantService';
import { APP_LABELS } from '../../../shared/constants/labels';

const BRN_REGEX = /^\d{3}-\d{2}-\d{5}$/;

function formatBrn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

type FormData = {
  companyName: string;
  businessRegistrationNumber: string;
  corporateNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  address: string;
  phoneNumber: string;
  registrationDate: string;
  adminName: string;
  adminEmail: string;
};

const EMPTY_FORM: FormData = {
  companyName: '',
  businessRegistrationNumber: '',
  corporateNumber: '',
  representativeName: '',
  businessType: '',
  businessCategory: '',
  address: '',
  phoneNumber: '',
  registrationDate: '',
  adminName: '',
  adminEmail: '',
};

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 140, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [brnError, setBrnError] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  const sampleTenantsQuery = useQuery({
    queryKey: ['sample-tenants'],
    queryFn: listSampleTenants,
  });

  const mutation = useMutation({
    mutationFn: (payload: IssueTenantCodeRequest) => issueTenantCode(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sample-tenants'] });
      setDuplicateError(false);
      setStep(3);
    },
    onError: (error: {
      status?: number;
      response?: { status?: number; data?: { code?: string } };
    }) => {
      const status = error?.response?.status ?? error?.status;
      const code = error?.response?.data?.code;
      if (status === 409 || code === 'DUPLICATE_BRN') {
        setDuplicateError(true);
      }
    },
  });

  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBrnChange = (raw: string) => {
    const formatted = formatBrn(raw);
    setField('businessRegistrationNumber', formatted);
    setBrnError(false);
  };

  const handleStep1Next = () => {
    const required: (keyof FormData)[] = [
      'companyName',
      'businessRegistrationNumber',
      'corporateNumber',
      'businessType',
      'businessCategory',
      'adminName',
      'adminEmail',
    ];
    const hasEmpty = required.some((k) => !form[k].trim());
    const brnInvalid = !BRN_REGEX.test(form.businessRegistrationNumber);

    if (hasEmpty) {
      setValidationError(true);
      return;
    }
    if (brnInvalid) {
      setBrnError(true);
      return;
    }
    setValidationError(false);
    setBrnError(false);
    setStep(2);
  };

  const handleIssue = () => {
    setDuplicateError(false);
    mutation.mutate({
      companyName: form.companyName.trim(),
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
    setForm(EMPTY_FORM);
    setBrnError(false);
    setValidationError(false);
    setDuplicateError(false);
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

      {/* ── Step 1: 정보 입력 ── */}
      {step === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={3}>
            {validationError && (
              <Alert severity="error">
                {APP_LABELS.message.onboardingFailed}
              </Alert>
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
                    onChange={(e) => setField('companyName', e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label={APP_LABELS.field.businessRegistrationNumber}
                    placeholder="000-00-00000"
                    value={form.businessRegistrationNumber}
                    onChange={(e) => handleBrnChange(e.target.value)}
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
                      setField('corporateNumber', e.target.value)
                    }
                    required
                    fullWidth
                  />
                  <TextField
                    label={APP_LABELS.field.representativeName}
                    value={form.representativeName}
                    onChange={(e) =>
                      setField('representativeName', e.target.value)
                    }
                    fullWidth
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={APP_LABELS.field.businessType}
                    placeholder="예: 식품제조업"
                    value={form.businessType}
                    onChange={(e) => setField('businessType', e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label={APP_LABELS.field.businessCategory}
                    placeholder="예: 즉석조리식품"
                    value={form.businessCategory}
                    onChange={(e) =>
                      setField('businessCategory', e.target.value)
                    }
                    required
                    fullWidth
                  />
                </Stack>
                <TextField
                  label={APP_LABELS.field.address}
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  fullWidth
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={APP_LABELS.field.phoneNumber}
                    placeholder="02-0000-0000"
                    value={form.phoneNumber}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={APP_LABELS.field.registrationDate}
                    type="date"
                    value={form.registrationDate}
                    onChange={(e) =>
                      setField('registrationDate', e.target.value)
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
                  onChange={(e) => setField('adminName', e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label={APP_LABELS.field.adminEmail}
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setField('adminEmail', e.target.value)}
                  required
                  fullWidth
                />
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStep1Next}
              >
                {APP_LABELS.action.nextStep}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* ── Step 2: 확인 ── */}
      {step === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              {APP_LABELS.onboarding.confirmTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {APP_LABELS.onboarding.confirmDescription}
            </Typography>

            {duplicateError && (
              <Alert severity="error">
                {APP_LABELS.message.onboardingDuplicateBrn}
              </Alert>
            )}
            {!duplicateError && mutation.isError && (
              <Alert severity="error">
                {APP_LABELS.message.onboardingFailed}
              </Alert>
            )}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'grey.50',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ mb: 1, display: 'block' }}
              >
                {APP_LABELS.onboarding.sectionCompanyInfo}
              </Typography>
              <LabelValue
                label={APP_LABELS.field.companyName}
                value={form.companyName}
              />
              <LabelValue
                label={APP_LABELS.field.businessRegistrationNumber}
                value={form.businessRegistrationNumber}
              />
              <LabelValue
                label={APP_LABELS.field.corporateNumber}
                value={form.corporateNumber}
              />
              <LabelValue
                label={APP_LABELS.field.representativeName}
                value={form.representativeName}
              />
              <LabelValue
                label={APP_LABELS.field.businessType}
                value={form.businessType}
              />
              <LabelValue
                label={APP_LABELS.field.businessCategory}
                value={form.businessCategory}
              />
              <LabelValue
                label={APP_LABELS.field.address}
                value={form.address}
              />
              <LabelValue
                label={APP_LABELS.field.phoneNumber}
                value={form.phoneNumber}
              />
              <LabelValue
                label={APP_LABELS.field.registrationDate}
                value={form.registrationDate}
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'grey.50',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ mb: 1, display: 'block' }}
              >
                {APP_LABELS.onboarding.sectionAdminInfo}
              </Typography>
              <LabelValue
                label={APP_LABELS.field.adminName}
                value={form.adminName}
              />
              <LabelValue
                label={APP_LABELS.field.adminEmail}
                value={form.adminEmail}
              />
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setDuplicateError(false);
                  mutation.reset();
                  setStep(1);
                }}
                disabled={mutation.isPending}
              >
                {APP_LABELS.action.edit}
              </Button>
              <Button
                variant="contained"
                onClick={handleIssue}
                disabled={mutation.isPending}
              >
                {APP_LABELS.action.issueTenantCode}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* ── Step 3: 완료 ── */}
      {step === 3 && mutation.isSuccess && (
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
                <LabelValue
                  label={APP_LABELS.onboarding.issuedTenantCode}
                  value={mutation.data.tenantCode}
                />
                <LabelValue
                  label={APP_LABELS.field.companyName}
                  value={mutation.data.companyName}
                />
                <LabelValue
                  label={APP_LABELS.field.adminEmail}
                  value={mutation.data.adminEmail}
                />
                <LabelValue
                  label={APP_LABELS.onboarding.mailDispatchStatus}
                  value={
                    APP_LABELS.onboarding.mailStatus[
                      mutation.data.mailDispatchStatus
                    ]
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
              <Button variant="outlined" onClick={handleReset}>
                {APP_LABELS.action.newTenantRegistration}
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
              >
                {APP_LABELS.action.goToDashboard}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* ── 발급 이력 ── */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          {APP_LABELS.onboarding.sampleTenantListTitle}
        </Typography>

        {sampleTenantsQuery.isPending && (
          <Typography variant="body2" color="text.secondary">
            {APP_LABELS.onboarding.sampleTenantListLoading}
          </Typography>
        )}
        {sampleTenantsQuery.isError && (
          <Alert severity="error">
            {APP_LABELS.onboarding.sampleTenantListError}
          </Alert>
        )}
        {!sampleTenantsQuery.isPending &&
          !sampleTenantsQuery.isError &&
          (sampleTenantsQuery.data?.length ?? 0) === 0 && (
            <Typography variant="body2" color="text.secondary">
              {APP_LABELS.onboarding.sampleTenantListEmpty}
            </Typography>
          )}
        {!sampleTenantsQuery.isPending &&
          !sampleTenantsQuery.isError &&
          (sampleTenantsQuery.data?.length ?? 0) > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {APP_LABELS.dashboard.platformAdmin.table.tenantCode}
                  </TableCell>
                  <TableCell>
                    {APP_LABELS.dashboard.platformAdmin.table.companyName}
                  </TableCell>
                  <TableCell>{APP_LABELS.field.adminEmail}</TableCell>
                  <TableCell>
                    {APP_LABELS.dashboard.platformAdmin.table.issuedAt}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(sampleTenantsQuery.data ?? []).map((item) => (
                  <TableRow key={item.tenantCode} hover>
                    <TableCell>
                      <Chip
                        label={item.tenantCode}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell>{item.adminEmail}</TableCell>
                    <TableCell>
                      {item.issuedAt ? item.issuedAt.slice(0, 10) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </Paper>
    </Stack>
  );
}
