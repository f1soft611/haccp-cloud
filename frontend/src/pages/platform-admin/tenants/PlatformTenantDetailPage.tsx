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
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
  dispatchTenantVerificationEmail,
  getPlatformTenantByCode,
  resendTenantVerificationEmail,
  type PlatformTenantManagementItem,
} from '../../../services/platform-admin/tenants/platformTenantManagementService';
import { PlatformTenantEditDialog } from './components/PlatformTenantEditDialog';

function onboardingStatusLabel(
  status: PlatformTenantManagementItem['onboardingStatus'],
) {
  if (status === 'ACTIVE') return '온보딩 완료';
  if (status === 'FIRST_SETUP_COMPLETED') return '초기 설정 완료';
  if (status === 'EMAIL_VERIFIED') return '메일 인증 완료';
  if (status === 'EMAIL_SENT') return '메일 발송 완료';
  return '메일 발송 대기';
}

function onboardingStatusColor(
  status: PlatformTenantManagementItem['onboardingStatus'],
) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'EMAIL_VERIFIED' || status === 'FIRST_SETUP_COMPLETED') {
    return 'info' as const;
  }
  return 'warning' as const;
}

const ONBOARDING_STEPS = [
  { status: 'EMAIL_QUEUED', label: '메일 대기' },
  { status: 'EMAIL_SENT', label: '메일 발송' },
  { status: 'EMAIL_VERIFIED', label: '메일 인증' },
  { status: 'FIRST_SETUP_COMPLETED', label: '초기 설정' },
  { status: 'ACTIVE', label: '활성' },
] as const;

function onboardingActiveStep(
  status: PlatformTenantManagementItem['onboardingStatus'],
): number {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx + 1; // +1 because Stepper activeStep marks the *next* incomplete
}

function detailValue(value?: string) {
  return value && value.trim() ? value : '-';
}

function formatDate(value?: string) {
  const normalized = detailValue(value);
  if (normalized === '-') {
    return normalized;
  }
  return normalized.slice(0, 10);
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
        {detailValue(value)}
      </Typography>
    </Box>
  );
}

function resolveActionErrorMessage(error: unknown): string {
  const payload = (error as { response?: { data?: { errorCode?: unknown } } })
    ?.response?.data;
  const errorCode = String(payload?.errorCode ?? '')
    .trim()
    .toUpperCase();

  if (errorCode === 'MAIL_CONFIG_ERROR') {
    return '환경 설정 확인 필요';
  }
  if (errorCode === 'MAIL_AUTH_ERROR') {
    return 'SMTP 계정/비밀번호 확인 필요';
  }

  return extractApiErrorMessage(error, '메일 처리 중 오류가 발생했습니다.');
}

export function PlatformTenantDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const { tenantCode = '' } = useParams<{ tenantCode: string }>();
  const normalizedTenantCode = tenantCode.trim();

  const tenantQuery = useQuery({
    queryKey: [
      'platform-admin',
      'tenant-management',
      'detail',
      normalizedTenantCode,
    ],
    queryFn: () => getPlatformTenantByCode(normalizedTenantCode),
    enabled: normalizedTenantCode.length > 0,
    retry: false,
  });

  const dispatchMutation = useMutation({
    mutationFn: () => dispatchTenantVerificationEmail(normalizedTenantCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'tenant-management'],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          'platform-admin',
          'tenant-management',
          'detail',
          normalizedTenantCode,
        ],
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendTenantVerificationEmail(normalizedTenantCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'tenant-management'],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          'platform-admin',
          'tenant-management',
          'detail',
          normalizedTenantCode,
        ],
      });
    },
  });

  const handleEditSaved = async () => {
    setEditOpen(false);
    setEditSaved(true);
    await queryClient.invalidateQueries({
      queryKey: ['platform-admin', 'tenant-management'],
    });
  };

  const row = tenantQuery.data;
  const onboardingStatus = row?.onboardingStatus;
  const isDispatchTarget = onboardingStatus === 'EMAIL_QUEUED';
  const isResendTarget =
    onboardingStatus === 'EMAIL_SENT' || onboardingStatus === 'EMAIL_VERIFIED';

  const actionError = dispatchMutation.error
    ? resolveActionErrorMessage(dispatchMutation.error)
    : resendMutation.error
      ? resolveActionErrorMessage(resendMutation.error)
      : null;

  return (
    <Stack spacing={3}>
      <PageHeader
        groupLabel="플랫폼 관리"
        title="업체 상세"
        description="업체 기본 정보와 온보딩 상태를 확인하고 메일 발송을 처리합니다."
      />

      <Stack direction="row" justifyContent="right" alignItems="center">
        <Button
          variant="outlined"
          onClick={() => navigate('/platform/tenants')}
        >
          목록으로
        </Button>
      </Stack>

      {tenantQuery.isError ? (
        <Alert severity="warning">업체 상세 정보를 불러오지 못했습니다.</Alert>
      ) : null}

      {!tenantQuery.isPending && !row ? (
        <Alert severity="info">업체 정보를 찾을 수 없습니다.</Alert>
      ) : null}

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      {dispatchMutation.isSuccess ? (
        <Alert severity="success">인증 메일 발송 요청을 완료했습니다.</Alert>
      ) : null}

      {resendMutation.isSuccess ? (
        <Alert severity="success">인증 메일 재발송 요청을 완료했습니다.</Alert>
      ) : null}

      {editSaved ? (
          <Alert severity="success">업체 정보를 수정했습니다.</Alert>
      ) : null}

      {/* 기존 -> 그라데이션 개요 Paper + 기본 정보/온보딩 액션 Card 2단 배치 */}
      {/* 변경 -> 단일 Paper 안에 섹션 구분선 + 3열 그리드 + 온보딩 타임라인 */}
      {row ? (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* 헤더: 회사명 + 상태 + 수정 */}
          <Box
            sx={{
              p: 3,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {detailValue(row.companyName)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  업체번호 {detailValue(row.tenantNo)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={onboardingStatusLabel(row.onboardingStatus)}
                  size="small"
                  color={onboardingStatusColor(row.onboardingStatus)}
                  variant={row.onboardingStatus === 'ACTIVE' ? 'filled' : 'outlined'}
                />
                <Chip
                  label={row.status === 'ACTIVE' ? '활성' : '비활성'}
                  size="small"
                  color={row.status === 'ACTIVE' ? 'success' : 'default'}
                  variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEditSaved(false);
                    setEditOpen(true);
                  }}
                >
                  수정
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* 섹션 1: 회사 / 사업자 정보 */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1.5 }}>
              회사 / 사업자 정보
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <DetailField label="업체명" value={row.companyName} />
              <DetailField label="사업자번호" value={row.businessRegistrationNumber} />
              <DetailField label="법인번호" value={row.corporateNumber} />
              <DetailField label="업종" value={row.businessType} />
              <DetailField label="업태" value={row.businessCategory} />
              <DetailField label="사업자등록일" value={row.registrationDate} />
              <DetailField label="업무개시일" value={row.serviceStartDate} />
              <DetailField label="생성일" value={formatDate(row.createdAt)} />
            </Box>
          </Box>

          <Divider />

          {/* 섹션 2: 관리자 / 플랜 */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1.5 }}>
              관리자 / 플랜
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <DetailField label="관리자명" value={row.adminName} />
              <DetailField label="관리자 이메일" value={row.adminEmail} />
              <DetailField
                label="플랜"
                value={
                  row.planName
                    ? `${row.planName} (${detailValue(row.planCode)})`
                    : detailValue(row.planCode)
                }
              />
            </Box>
          </Box>

          <Divider />

          {/* 섹션 3: 온보딩 */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 2 }}>
              온보딩
            </Typography>
            <Stepper
              activeStep={onboardingActiveStep(row.onboardingStatus)}
              alternativeLabel
              sx={{ mb: 2 }}
            >
              {ONBOARDING_STEPS.map((step) => (
                <Step key={step.status}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Stack direction="row" spacing={1.25} sx={{ mt: 1 }}>
              {isDispatchTarget ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => dispatchMutation.mutate()}
                  disabled={dispatchMutation.isPending || resendMutation.isPending}
                >
                  메일 발송
                </Button>
              ) : null}
              {isResendTarget ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => resendMutation.mutate()}
                  disabled={dispatchMutation.isPending || resendMutation.isPending}
                >
                  메일 재발송
                </Button>
              ) : null}
              {!isDispatchTarget && !isResendTarget ? (
                <Alert severity="info" sx={{ width: '100%' }}>
                  현재 상태에서는 메일 액션이 필요하지 않습니다.
                </Alert>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      ) : null}

      {row && editOpen ? (
          <PlatformTenantEditDialog
              open
              tenant={row}
              onClose={() => setEditOpen(false)}
              onSaved={() => {
                void handleEditSaved();
              }}
          />
      ) : null}
    </Stack>
  );
}
