import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyTenantEmail } from '../../../services/organization/tenantService';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';

function resolveVerificationErrorMessage(error: unknown): string {
  const rawMessage = extractApiErrorMessage(
    error,
    '이메일 인증에 실패했습니다.',
  );

  if (rawMessage.toLowerCase().includes('토큰이 존재하지 않습니다')) {
    return '인증 링크가 유효하지 않습니다.';
  }

  if (rawMessage.toLowerCase().includes('만료된 토큰')) {
    return '인증 링크가 만료되었습니다. 관리자에게 다시 발송을 요청해주세요.';
  }

  return rawMessage;
}

export function OnboardingVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authToken = useMemo(
    () => searchParams.get('token')?.trim() ?? '',
    [searchParams],
  );

  const mutation = useMutation({
    mutationFn: () => verifyTenantEmail(authToken),
  });

  const message = mutation.isError
    ? resolveVerificationErrorMessage(mutation.error)
    : (mutation.data?.message ?? '인증 정보를 확인하는 중입니다.');

  if (!authToken) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', py: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Alert severity="warning">인증 토큰이 없습니다.</Alert>
              <Typography variant="body2" color="text.secondary">
                이메일 링크를 다시 확인해 주세요.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/login')}>
                로그인으로 이동
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!mutation.isSuccess && !mutation.isPending && !mutation.isError) {
    mutation.mutate();
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 8 }}>
      <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            px: 3,
            py: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #0b6ef3 0%, #00a2c7 100%)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ letterSpacing: 2, opacity: 0.9 }}
          >
            HACCP CLOUD
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            이메일 인증
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            업체 관리자 온보딩을 완료하는 중입니다.
          </Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {mutation.isPending ? (
              <Alert severity="info">인증을 확인하고 있습니다.</Alert>
            ) : null}
            {mutation.isError ? (
              <Alert severity="error">{message}</Alert>
            ) : null}
            {mutation.isSuccess ? (
              <Alert severity="success">{message}</Alert>
            ) : null}

            {mutation.isSuccess ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  업체명: {mutation.data.tenantNm || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  업체 코드: {mutation.data.tenantCode || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  관리자 이메일: {mutation.data.adminEmail || '-'}
                </Typography>
                <Button variant="contained" onClick={() => navigate('/login')}>
                  로그인으로 이동
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
