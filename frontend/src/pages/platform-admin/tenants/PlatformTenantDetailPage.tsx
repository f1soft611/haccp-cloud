import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
  dispatchTenantVerificationEmail,
  getPlatformTenantByCode,
  resendTenantVerificationEmail,
  type PlatformTenantManagementItem,
} from '../../../services/platform-admin/tenants/platformTenantManagementService';

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

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          업체 코드: {normalizedTenantCode || '-'}
        </Typography>
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

      {row ? (
        <Stack spacing={2.5}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background:
                'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(46,125,50,0.08))',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                TENANT OVERVIEW
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {detailValue(row.companyName)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={onboardingStatusLabel(row.onboardingStatus)}
                  size="small"
                  color={onboardingStatusColor(row.onboardingStatus)}
                  variant={
                    row.onboardingStatus === 'ACTIVE' ? 'filled' : 'outlined'
                  }
                />
                <Chip
                  label={row.status === 'ACTIVE' ? '활성' : '비활성'}
                  size="small"
                  color={row.status === 'ACTIVE' ? 'success' : 'default'}
                  variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
                />
                <Chip
                  label={`업체 코드 ${detailValue(row.tenantCode)}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 2,
            }}
          >
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  기본 정보
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <DetailField label="관리자명" value={row.adminName} />
                  <DetailField label="관리자 이메일" value={row.adminEmail} />
                  <DetailField label="플랜 코드" value={row.planCode} />
                  <DetailField label="플랜명" value={row.planName} />
                  <DetailField label="법인번호" value={row.corporateNumber} />
                  <DetailField
                    label="생성일"
                    value={formatDate(row.createdAt)}
                  />
                  <DetailField label="업종" value={row.businessType} />
                  <DetailField label="업태" value={row.businessCategory} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  온보딩 액션
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  현재 상태에 따라 필요한 메일 액션만 노출됩니다.
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {isDispatchTarget ? (
                    <Button
                      variant="contained"
                      onClick={() => dispatchMutation.mutate()}
                      disabled={
                        dispatchMutation.isPending || resendMutation.isPending
                      }
                    >
                      메일 발송
                    </Button>
                  ) : null}

                  {isResendTarget ? (
                    <Button
                      variant="outlined"
                      onClick={() => resendMutation.mutate()}
                      disabled={
                        dispatchMutation.isPending || resendMutation.isPending
                      }
                    >
                      메일 재발송
                    </Button>
                  ) : null}

                  {!isDispatchTarget && !isResendTarget ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      현재 상태에서는 메일 액션이 필요하지 않습니다.
                    </Alert>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}
