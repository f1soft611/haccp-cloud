import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  completeTenantOnboarding,
  getTenantByDomain,
  verifyTenantEmailByToken,
} from '../../../services/organization/tenantService';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';

const DOMAIN_PATTERN =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function normalizeDomainInput(value: string): string {
  let normalized = value.trim().toLowerCase();

  if (normalized.startsWith('http://')) {
    normalized = normalized.slice(7);
  } else if (normalized.startsWith('https://')) {
    normalized = normalized.slice(8);
  }

  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function resolveVerificationErrorMessage(error: unknown): string {
  const responseData = (
    error as {
      response?: {
        data?: {
          statusCode?: unknown;
          errorCode?: unknown;
          result?: {
            statusCode?: unknown;
            errorCode?: unknown;
          };
        };
      };
    }
  )?.response?.data;

  const payload = responseData?.result ?? responseData;

  const statusCode = Number(payload?.statusCode ?? 0);
  const errorCode = String(payload?.errorCode ?? '')
    .trim()
    .toUpperCase();

  if (statusCode === 400 && errorCode === 'INVALID_AUTH_TOKEN') {
    return '인증 링크가 유효하지 않습니다.';
  }

  if (statusCode === 410 && errorCode === 'AUTH_TOKEN_EXPIRED') {
    return '인증 링크가 만료되었습니다. 관리자에게 다시 발송을 요청해주세요.';
  }

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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginDomainInput, setLoginDomainInput] = useState('');
  const [logoImage, setLogoImage] = useState<string | undefined>(undefined);
  const [validationMessage, setValidationMessage] = useState('');
  const [tenantCodeFromDomain, setTenantCodeFromDomain] = useState('');

  const authToken = useMemo(
    () => searchParams.get('token')?.trim() ?? '',
    [searchParams],
  );
  const domainParam = useMemo(
    () => searchParams.get('domain')?.trim() ?? '',
    [searchParams],
  );

  useEffect(() => {
    if (!domainParam || tenantCodeFromDomain) {
      return;
    }

    let disposed = false;

    const loadTenantCode = async () => {
      try {
        const tenantInfo = await getTenantByDomain(domainParam);
        if (!disposed) {
          setTenantCodeFromDomain(tenantInfo?.tenantCode ?? '');
        }
      } catch {
        if (!disposed) {
          setTenantCodeFromDomain('');
        }
      }
    };

    void loadTenantCode();

    return () => {
      disposed = true;
    };
  }, [domainParam, tenantCodeFromDomain]);

  const verifyMutation = useMutation({
    mutationFn: () => verifyTenantEmailByToken(authToken),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!verifyMutation.data) {
        throw new Error('인증 정보를 다시 확인해 주세요.');
      }

      await completeTenantOnboarding({
        tenantCode: verifyMutation.data.tenantCode,
        authToken,
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        loginDomain: normalizeDomainInput(loginDomainInput) || undefined,
        logoImage,
      });
    },
  });

  useEffect(() => {
    if (!authToken) {
      return;
    }
    if (verifyMutation.status !== 'idle') {
      return;
    }

    verifyMutation.mutate();
  }, [authToken, verifyMutation]);

  useEffect(() => {
    if (!verifyMutation.data?.adminEmail || loginDomainInput.trim()) {
      return;
    }

    const atIndex = verifyMutation.data.adminEmail.indexOf('@');
    if (atIndex < 0) {
      return;
    }

    setLoginDomainInput(verifyMutation.data.adminEmail.slice(atIndex + 1));
  }, [loginDomainInput, verifyMutation.data?.adminEmail]);

  const loginDomain = useMemo(() => {
    const explicitDomain = normalizeDomainInput(loginDomainInput);
    if (explicitDomain) {
      return explicitDomain;
    }

    const email = verifyMutation.data?.adminEmail ?? '';
    const atIndex = email.indexOf('@');
    if (atIndex < 0) {
      return '';
    }
    return email
      .slice(atIndex + 1)
      .trim()
      .toLowerCase();
  }, [loginDomainInput, verifyMutation.data?.adminEmail]);

  const verificationMessage = verifyMutation.isError
    ? resolveVerificationErrorMessage(verifyMutation.error)
    : (verifyMutation.data?.message ?? '인증 정보를 확인하는 중입니다.');

  const completionMessage = completeMutation.isError
    ? extractApiErrorMessage(
        completeMutation.error,
        '비밀번호 설정에 실패했습니다.',
      )
    : '비밀번호 설정이 완료되었습니다.';

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

  const handleCompleteOnboarding = () => {
    setValidationMessage('');

    if (!verifyMutation.data) {
      setValidationMessage(
        '이메일 인증 정보를 찾을 수 없습니다. 다시 시도해 주세요.',
      );
      return;
    }
    if (!password.trim()) {
      setValidationMessage('비밀번호를 입력해 주세요.');
      return;
    }
    if (password.length < 8) {
      setValidationMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setValidationMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const normalizedDomain = normalizeDomainInput(loginDomainInput);
    if (!normalizedDomain) {
      setValidationMessage('로그인 도메인을 입력해 주세요.');
      return;
    }
    if (!DOMAIN_PATTERN.test(normalizedDomain)) {
      setValidationMessage('유효한 도메인 형식으로 입력해 주세요.');
      return;
    }

    completeMutation.mutate();
  };

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setValidationMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setValidationMessage('로고 파일 크기는 2MB 이하만 가능합니다.');
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () =>
          reject(new Error('로고 파일을 읽을 수 없습니다.'));
        reader.readAsDataURL(file);
      });

      setLogoImage(dataUrl || undefined);
      setValidationMessage('');
    } catch {
      setValidationMessage('로고 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const handleMoveToLogin = () => {
    if (loginDomain) {
      navigate(`/login/${encodeURIComponent(loginDomain)}`);
      return;
    }
    navigate('/login');
  };

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
            {verifyMutation.isPending ? (
              <Alert severity="info">인증을 확인하고 있습니다.</Alert>
            ) : null}
            {verifyMutation.isError ? (
              <Alert severity="error">{verificationMessage}</Alert>
            ) : null}
            {verifyMutation.isSuccess ? (
              <Alert severity="success">{verificationMessage}</Alert>
            ) : null}

            {completeMutation.isSuccess ? (
              <Alert severity="success">{completionMessage}</Alert>
            ) : null}
            {completeMutation.isError ? (
              <Alert severity="error">{completionMessage}</Alert>
            ) : null}
            {validationMessage ? (
              <Alert severity="warning">{validationMessage}</Alert>
            ) : null}

            {verifyMutation.isSuccess ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  업체명: {verifyMutation.data.tenantNm || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  업체 코드: {verifyMutation.data.tenantCode || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  관리자 이메일: {verifyMutation.data.adminEmail || '-'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  관리자 아이디:{' '}
                  {verifyMutation.data.adminLoginCode ||
                    String(verifyMutation.data.loginAccountId || '-')}
                </Typography>

                {!completeMutation.isSuccess ? (
                  <Stack spacing={1.25} sx={{ pt: 1 }}>
                    <TextField
                      label="회사 로그인 도메인"
                      placeholder="example.com"
                      value={loginDomainInput}
                      onChange={(event) =>
                        setLoginDomainInput(event.target.value)
                      }
                      fullWidth
                    />
                    <Button variant="outlined" component="label">
                      회사 로고 등록(선택)
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={(event) => {
                          void handleLogoFileChange(event);
                        }}
                      />
                    </Button>
                    {logoImage ? (
                      <Box
                        component="img"
                        src={logoImage}
                        alt="회사 로고 미리보기"
                        sx={{ width: 120, height: 120, objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        로고를 등록하지 않으면 회사명 텍스트가 기본으로
                        노출됩니다.
                      </Typography>
                    )}
                    <TextField
                      label="비밀번호"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      fullWidth
                    />
                    <TextField
                      label="비밀번호 확인"
                      type="password"
                      value={passwordConfirm}
                      onChange={(event) =>
                        setPasswordConfirm(event.target.value)
                      }
                      autoComplete="new-password"
                      fullWidth
                    />
                    <TextField
                      label="전화번호(선택)"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleCompleteOnboarding}
                      disabled={completeMutation.isPending}
                    >
                      비밀번호 설정 완료
                    </Button>
                  </Stack>
                ) : null}

                <Button variant="outlined" onClick={handleMoveToLogin}>
                  {loginDomain
                    ? `${loginDomain} 로그인으로 이동`
                    : '로그인으로 이동'}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
