import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { appTheme } from '../../app/theme';
import { login } from '../../services/auth/authService';
import { getCurrentPlanAccess } from '../../services/platform-admin/planAccessService';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import {
  getTenantByDomain,
  type TenantDomainInfo,
} from '../../services/organization/tenantService';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';
import {
  loadLastLoginDomain,
  normalizeLoginDomain,
  persistLastLoginDomain,
} from '../../shared/utils/loginDomainRouting';
import { resolveDashboardLandingPath } from '../../shared/utils/dashboardRouting';

type TenantBrandCache = {
  tenantNm: string;
  logoImage?: string;
};

function normalizeDomainCandidate(value: string): string {
  return normalizeLoginDomain(value);
}

function resolveSafeLogoSrc(logoImage?: string): string {
  const value = (logoImage ?? '').trim();
  if (!value) {
    return '';
  }

  if (value.startsWith('data:image/')) {
    return value;
  }

  if (value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('http://')) {
    return import.meta.env.PROD ? '' : value;
  }

  // Accept plain base64 payload from legacy tenant logo responses.
  if (/^[a-z0-9+/=\r\n]+$/i.test(value) && value.length >= 32) {
    const compact = value.replace(/\s+/g, '');
    return `data:image/png;base64,${compact}`;
  }

  return '';
}

function resolveTenantBrandStorageKey(domain: string): string {
  return `haccp.tenant-brand.${domain}`;
}

function resolveLastLoginUserIdStorageKey(domain: string): string {
  return `haccp.last-login-userid.${domain}`;
}

function loadLastLoginUserId(domain: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const raw = window.localStorage.getItem(
    resolveLastLoginUserIdStorageKey(domain),
  );
  return (raw ?? '').trim();
}

function persistLastLoginUserId(domain: string, userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = userId.trim();
  if (!normalized) {
    return;
  }

  window.localStorage.setItem(
    resolveLastLoginUserIdStorageKey(domain),
    normalized,
  );
}

function loadTenantBrandCache(domain: string): TenantBrandCache | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      resolveTenantBrandStorageKey(domain),
    );
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TenantBrandCache>;
    const tenantNm = (parsed.tenantNm ?? '').trim();
    if (!tenantNm) {
      return null;
    }

    return {
      tenantNm,
      logoImage: parsed.logoImage,
    };
  } catch {
    return null;
  }
}

function persistTenantBrandCache(
  domain: string,
  brand: TenantBrandCache,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    resolveTenantBrandStorageKey(domain),
    JSON.stringify(brand),
  );
}

function resolveDomainFromLocation(routeDomain?: string): string {
  const normalizedRouteDomain = normalizeDomainCandidate(routeDomain ?? '');
  if (normalizedRouteDomain) {
    return normalizedRouteDomain;
  }

  return '';
}

export function LoginPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const { domain: routeDomain } = useParams<{ domain?: string }>();
  const setAuth = useAuthStore((state) => state.login);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginStep, setLoginStep] = useState<'id' | 'password'>('id');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<TenantDomainInfo | null>(null);
  const [tenantBrand, setTenantBrand] = useState<TenantBrandCache | null>(null);
  const [recommendedDomain, setRecommendedDomain] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [domain, setDomain] = useState('');
  const userIdInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const shouldSkipAutoDomainRedirect =
    (location.state as { skipAutoDomainRedirect?: boolean } | null)
      ?.skipAutoDomainRedirect === true;

  useEffect(() => {
    let mounted = true;
    let hasNavigatedFallback = false;

    const loadTenant = async () => {
      const resolvedDomain = resolveDomainFromLocation(routeDomain);
      if (!mounted) {
        return;
      }

      setDomain('');
      setLoginStep('password');
      setPassword('');
      setTenantInfo(null);
      setTenantCode('');
      setTenantBrand(null);
      setRecommendedDomain('');

      if (!resolvedDomain) {
        const lastDomain = loadLastLoginDomain();
        if (lastDomain) {
          setRecommendedDomain(lastDomain);
        }

        if (lastDomain && !shouldSkipAutoDomainRedirect) {
          navigate(`/login/${encodeURIComponent(lastDomain)}`, {
            replace: true,
          });
          return;
        }
        return;
      }

      try {
        const info = await getTenantByDomain(resolvedDomain);
        if (!mounted) {
          return;
        }

        if (!info) {
          if (!hasNavigatedFallback) {
            hasNavigatedFallback = true;
            navigate('/login', {
              replace: true,
              state: { skipAutoDomainRedirect: true },
            });
          }
          return;
        }

        setDomain(resolvedDomain);
        setLoginStep('id');

        const rememberedUserId = loadLastLoginUserId(resolvedDomain);
        if (rememberedUserId) {
          setUserId(rememberedUserId);
          setLoginStep('password');
        }

        const cachedBrand = loadTenantBrandCache(resolvedDomain);
        if (cachedBrand) {
          setTenantBrand(cachedBrand);
        }

        setTenantInfo(info);
        if (info?.tenantNm) {
          const nextBrand = {
            tenantNm: info.tenantNm,
            logoImage: info.logoImage,
          };
          setTenantBrand(nextBrand);
          persistTenantBrandCache(resolvedDomain, nextBrand);
        }
        if (info?.tenantCode) {
          setTenantCode(info.tenantCode);
        }
      } catch {
        if (!mounted) {
          return;
        }

        if (!hasNavigatedFallback) {
          hasNavigatedFallback = true;
          navigate('/login', {
            replace: true,
            state: { skipAutoDomainRedirect: true },
          });
        }
      }
    };

    void loadTenant();

    return () => {
      mounted = false;
    };
  }, [routeDomain, navigate, shouldSkipAutoDomainRedirect]);

  const applyRecommendedDomain = () => {
    if (!recommendedDomain) {
      return;
    }

    navigate(`/login/${encodeURIComponent(recommendedDomain)}`, {
      replace: true,
    });
  };

  const logoSrc = resolveSafeLogoSrc(tenantBrand?.logoImage);
  const isDomainScopedLogin = !!domain;
  const normalizedIdInput = userId.trim();
  const effectiveUserId =
    isDomainScopedLogin && normalizedIdInput && !normalizedIdInput.includes('@')
      ? `${normalizedIdInput}@${domain}`
      : normalizedIdInput;
  const canSubmitIdStep = normalizedIdInput.length > 0;
  const canSubmitPasswordStep =
    normalizedIdInput.length > 0 && password.trim().length > 0;
  const tenantDisplayName =
    tenantBrand?.tenantNm?.trim() || tenantInfo?.tenantNm?.trim() || '';
  const appLogoSrc = isDarkMode ? '/f1foodlink_wh.png' : '/f1foodlink_midd.png';
  const fallbackLogoSrc = appLogoSrc;
  const lightPalette = appTheme.palette;
  const fieldDefaultBorder = '1px solid #cbd5e1';
  const fieldFocusBorder = `1px solid ${lightPalette.primary.main}`;
  const fieldFocusShadow = `0 0 0 3px ${alpha(lightPalette.primary.main, 0.18)}`;
  const loginTitle = tenantDisplayName
    ? `${tenantDisplayName}에 로그인`
    : isDomainScopedLogin
      ? `${domain} 오피스에 로그인`
      : APP_LABELS.pageTitle.login;
  const loginHelpText = isDomainScopedLogin
    ? loginStep === 'id'
      ? '로그인 ID를 입력하세요.'
      : '본인 확인을 위해 비밀번호를 입력하세요.'
    : APP_LABELS.message.loginHelp;

  useEffect(() => {
    if (!isDomainScopedLogin || loginStep !== 'password') {
      return;
    }

    passwordInputRef.current?.focus();
  }, [isDomainScopedLogin, loginStep]);

  const performLogin = async () => {
    setError('');

    setIsLoading(true);
    try {
      const result = await login({
        userId: effectiveUserId,
        password,
        tenantCode,
      });

      let planCode: string | undefined;
      try {
        const currentPlanAccess = await getCurrentPlanAccess({
          accessToken: result.accessToken,
          tenantCode: result.tenantCode,
        });
        planCode =
          currentPlanAccess.planCode?.trim().toUpperCase() || undefined;
      } catch {
        console.warn('Failed to resolve current plan after login.');
      }

      setAuth({
        tenantCode: result.tenantCode,
        planCode,
        userId: result.userId,
        displayName: result.displayName,
        role: result.role,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        loginHistoryId: result.loginHistoryId,
        onboardingRequired: result.onboardingRequired,
        onboardingStatus: result.onboardingStatus,
      });
      const userIdDomain = normalizeLoginDomain(
        effectiveUserId.includes('@')
          ? (effectiveUserId.split('@').pop() ?? '')
          : '',
      );
      const domainToPersist = normalizeLoginDomain(domain) || userIdDomain;
      if (domainToPersist) {
        persistLastLoginDomain(domainToPersist);
        const localPart = normalizedIdInput.includes('@')
          ? (normalizedIdInput.split('@')[0] ?? '').trim()
          : normalizedIdInput;
        if (localPart) {
          persistLastLoginUserId(domainToPersist, localPart);
        }
      }
      navigate(resolveDashboardLandingPath({ role: result.role, planCode }), {
        replace: true,
      });
    } catch (err) {
      setError(extractApiErrorMessage(err, APP_LABELS.message.loginFailed));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!canSubmitIdStep) {
      setError('로그인 ID를 입력하세요.');
      return;
    }

    setError('');
    setLoginStep('password');
  };

  const handleIdFieldEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (isDomainScopedLogin && loginStep === 'id') {
      event.preventDefault();
      handleNextStep();
    }
  };

  const handlePasswordFieldEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    if (!isLoading && canSubmitPasswordStep) {
      void performLogin();
    }
  };

  return (
    <Box
      data-testid="login-page-shell"
      data-theme-mode={isDarkMode ? 'dark' : 'light'}
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      px={2}
      sx={{
        position: 'relative',
        backgroundColor: '#f3f4f6',
      }}
    >
      {!isDomainScopedLogin && (
        <Box
          component="img"
          src={appLogoSrc}
          alt="F1FoodLink"
          sx={{
            position: 'absolute',
            top: 12,
            left: { xs: 16, md: 'calc(50% - 470px)' },
            display: 'block',
            width: 148,
            height: 25,
            objectFit: 'contain',
            imageRendering: '-webkit-optimize-contrast',
          }}
        />
      )}

      <Box
        sx={{
          width: '100%',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 6, md: 9 },
        }}
      >
        <Stack spacing={2.8} sx={{ width: '100%', maxWidth: 460 }}>
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid #d7dce5',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              bgcolor: '#ffffff',
            }}
          >
            <CardContent sx={{ px: 4.5, py: 5.8 }}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  {logoSrc && (
                    <Box
                      component="img"
                      src={logoSrc}
                      alt={tenantBrand?.tenantNm || '회사 로고'}
                      sx={{
                        display: 'block',
                        maxHeight: 52,
                        maxWidth: 220,
                        mx: 'auto',
                        mb: 5,
                        objectFit: 'contain',
                      }}
                    />
                  )}
                  {!logoSrc && isDomainScopedLogin && (
                    <Box
                      component="img"
                      data-testid="login-fallback-logo"
                      src={fallbackLogoSrc}
                      alt="기본 회사 로고"
                      sx={{
                        display: 'block',
                        maxHeight: 56,
                        maxWidth: 240,
                        mx: 'auto',
                        mb: 5,
                        objectFit: 'contain',
                      }}
                    />
                  )}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
                      color: '#111827',
                    }}
                  >
                    {loginTitle}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1.8,
                      fontSize: 15,
                      color: '#4b5563',
                    }}
                  >
                    {loginHelpText}
                  </Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                {!domain && recommendedDomain && (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={applyRecommendedDomain}
                      >
                        적용
                      </Button>
                    }
                  >
                    최근 로그인 도메인: {recommendedDomain}
                  </Alert>
                )}

                <Stack spacing={1.9}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 56,
                      borderRadius: 1.5,
                      border: fieldDefaultBorder,
                      backgroundColor: '#ffffff',
                      px: 1.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition:
                        'border-color 0.16s ease, box-shadow 0.16s ease',
                      '&:focus-within': {
                        border: fieldFocusBorder,
                        boxShadow: fieldFocusShadow,
                      },
                    }}
                  >
                    <Box
                      component="input"
                      ref={userIdInputRef}
                      value={userId}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (isDomainScopedLogin) {
                          setUserId(nextValue.split('@')[0] ?? '');
                          return;
                        }

                        setUserId(nextValue);
                      }}
                      disabled={isLoading}
                      readOnly={isDomainScopedLogin && loginStep === 'password'}
                      placeholder="로그인 ID"
                      aria-label={APP_LABELS.field.userId}
                      onKeyDown={handleIdFieldEnter}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        border: 0,
                        outline: 0,
                        fontSize: 16,
                        backgroundColor: 'transparent',
                        color: '#0f172a',
                        '&::placeholder': {
                          color: '#94a3b8',
                        },
                      }}
                    />
                    {isDomainScopedLogin && (
                      <Typography sx={{ color: '#64748b', fontSize: 15 }}>
                        @{domain}
                      </Typography>
                    )}
                  </Box>

                  {(!isDomainScopedLogin || loginStep === 'password') && (
                    <Box
                      component="input"
                      type="password"
                      aria-label={APP_LABELS.field.password}
                      ref={passwordInputRef}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handlePasswordFieldEnter}
                      disabled={isLoading}
                      placeholder={APP_LABELS.field.password}
                      sx={{
                        width: '100%',
                        height: 56,
                        borderRadius: 1.5,
                        border: fieldDefaultBorder,
                        outline: 0,
                        transition:
                          'border-color 0.16s ease, box-shadow 0.16s ease',
                        backgroundColor: '#ffffff',
                        px: 1.6,
                        boxSizing: 'border-box',
                        fontSize: 16,
                        color: '#0f172a',
                        '&:focus': {
                          border: fieldFocusBorder,
                          boxShadow: fieldFocusShadow,
                        },
                        '&::placeholder': {
                          color: '#94a3b8',
                        },
                      }}
                    />
                  )}
                </Stack>

                {tenantInfo?.tenantCode && (
                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: lightPalette.primary.dark,
                      fontWeight: 600,
                    }}
                  >
                    업체 코드: {tenantInfo.tenantCode}
                  </Typography>
                )}

                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    if (isDomainScopedLogin && loginStep === 'id') {
                      handleNextStep();
                      return;
                    }

                    void performLogin();
                  }}
                  disabled={
                    isLoading ||
                    (isDomainScopedLogin && loginStep === 'id'
                      ? !canSubmitIdStep
                      : !canSubmitPasswordStep)
                  }
                  sx={{
                    height: 56,
                    border: 0,
                    borderRadius: 1.5,
                    fontWeight: 700,
                    fontSize: 17,
                    cursor: 'pointer',
                    backgroundColor: lightPalette.primary.main,
                    color: lightPalette.primary.contrastText,
                    '&:disabled': {
                      cursor: 'not-allowed',
                      backgroundColor: lightPalette.primary.light,
                      color: '#e2e8f0',
                    },
                    '&:not(:disabled):hover': {
                      backgroundColor: lightPalette.primary.dark,
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isDomainScopedLogin && loginStep === 'id' ? (
                    '다음'
                  ) : (
                    APP_LABELS.action.login
                  )}
                </Box>

                {isDomainScopedLogin && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {loginStep === 'password' && (
                      <Button
                        variant="text"
                        onClick={() => {
                          setPassword('');
                          setLoginStep('id');
                          userIdInputRef.current?.focus();
                        }}
                        sx={{
                          px: 0,
                          minWidth: 'auto',
                          textTransform: 'none',
                          color: lightPalette.primary.main,
                        }}
                      >
                        다른 ID로 로그인
                      </Button>
                    )}

                    {loginStep === 'id' && (
                      <Button
                        variant="text"
                        onClick={() => {
                          setUserId('');
                          setPassword('');
                          setError('');
                          navigate('/login', {
                            replace: true,
                            state: { skipAutoDomainRedirect: true },
                          });
                        }}
                        sx={{
                          px: 0,
                          minWidth: 'auto',
                          textTransform: 'none',
                          color: lightPalette.primary.main,
                        }}
                      >
                        다른 도메인으로 로그인
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Box
            data-testid="login-notice-bar"
            sx={{
              px: 1.2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 1.5,
              border: '1px solid rgba(148,163,184,0.35)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#334155',
              fontSize: 13,
            }}
          >
            <Typography component="span" sx={{ fontSize: 13 }}>
              📢
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              공지사항 - 도메인 기반 로그인 라우팅이 적용되었습니다.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Typography
        data-testid="login-footer-copyright"
        sx={{
          pb: 3.2,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0',
          color: 'rgba(100,116,139,0.52)',
          fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
        }}
      >
        © F1soft Inc.
      </Typography>
    </Box>
  );
}
