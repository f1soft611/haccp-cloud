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
import { login, loginPlatformAdmin } from '../../services/auth/authService';
import { getCurrentPlanAccess } from '../../services/platform-admin/planAccessService';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import { getTenantByTenantNo } from '../../services/organization/tenantService';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';
import {
  loadLastLoginTenantNo,
  normalizeTenantNo,
  persistLastLoginTenantNo,
} from '../../shared/utils/loginDomainRouting';
import { resolveDashboardLandingPath } from '../../shared/utils/dashboardRouting';

type TenantBrandCache = {
  tenantNm: string;
  logoImage?: string;
};

// function normalizeDomainCandidate(value: string): string {
//   return normalizeLoginDomain(value);
// }

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

function resolveTenantBrandStorageKey(tenantNo: string): string {
  return `haccp.tenant-brand.${tenantNo}`;
}

function resolveLastLoginUserIdStorageKey(tenantNo: string): string {
  return `haccp.last-login-userid.${tenantNo}`;
}

function loadLastLoginUserId(tenantNo: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const raw = window.localStorage.getItem(
    resolveLastLoginUserIdStorageKey(tenantNo),
  );
  return (raw ?? '').trim();
}

function persistLastLoginUserId(tenantNo: string, userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = userId.trim();
  if (!normalized) {
    return;
  }

  window.localStorage.setItem(
    resolveLastLoginUserIdStorageKey(tenantNo),
    normalized,
  );
}

// function loadTenantBrandCache(domain: string): TenantBrandCache | null {
//   if (typeof window === 'undefined') {
//     return null;
//   }
//
//   try {
//     const raw = window.sessionStorage.getItem(
//       resolveTenantBrandStorageKey(domain),
//     );
//     if (!raw) {
//       return null;
//     }
//
//     const parsed = JSON.parse(raw) as Partial<TenantBrandCache>;
//     const tenantNm = (parsed.tenantNm ?? '').trim();
//     if (!tenantNm) {
//       return null;
//     }
//
//     return {
//       tenantNm,
//       logoImage: parsed.logoImage,
//     };
//   } catch {
//     return null;
//   }
// }

function persistTenantBrandCache(
    tenantNo: string,
  brand: TenantBrandCache,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    resolveTenantBrandStorageKey(tenantNo),
    JSON.stringify(brand),
  );
}

// function resolveDomainFromLocation(routeDomain?: string): string {
//   const normalizedRouteDomain = normalizeDomainCandidate(routeDomain ?? '');
//   if (normalizedRouteDomain) {
//     return normalizedRouteDomain;
//   }
//
//   return '';
// }

type LoginPageProps = {
  adminMode?: boolean;
};

export function LoginPage({ adminMode = false }: LoginPageProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  // 기존 -> URL 파라미터 domain
  // 변경 -> URL 파라미터 tenantNo
  const { tenantNo: routeTenantNo } = useParams<{ tenantNo?: string }>();
  const setAuth = useAuthStore((state) => state.login);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginStep, setLoginStep] = useState<'id' | 'password'>('id');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantBrand, setTenantBrand] = useState<TenantBrandCache | null>(null);
  // 기존 -> tenantInfo / recommendedDomain / tenantCode / domain 상태
  // 변경 -> 업체번호 화면의 확정된 업체번호(tenantNo), 3칸 화면의 업체번호 입력값(tenantNoInput)
  const [tenantNo, setTenantNo] = useState('');
  const [tenantNoInput, setTenantNoInput] = useState('');
  const userIdInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  // 기존 -> skipAutoDomainRedirect: 마지막 도메인으로 자동 이동 생략
  // 변경 -> skipPrefill: "다른 업체번호로 로그인"으로 왔을 때 마지막 업체번호/아이디 미리 채우기 생략
  const shouldSkipPrefill =
      (location.state as { skipPrefill?: boolean } | null)?.skipPrefill === true;
  const isAdminRoute = adminMode;

  useEffect(() => {
    if (isAdminRoute) {
      setTenantNo('');
      setLoginStep('id');
      setPassword('');
      setTenantBrand(null);
      return;
    }
    let mounted = true;

    // 기존 -> 도메인으로 업체 조회, 도메인이 없으면 마지막 도메인 경로로 자동 이동
    // 변경 -> 업체번호로 업체 조회(실패/형식 불일치 시 /login), /login이면 마지막 업체번호·아이디 미리 채우기
    const loadTenant = async () => {
      setTenantNo('');
      setLoginStep('password');
      setPassword('');
      setTenantBrand(null);

      if (!routeTenantNo) {
        const lastTenantNo = shouldSkipPrefill ? '' : loadLastLoginTenantNo();
        setTenantNoInput(lastTenantNo);
        setUserId(lastTenantNo ? loadLastLoginUserId(lastTenantNo) : '');
        return;
      }

      const normalizedTenantNo = normalizeTenantNo(routeTenantNo);
      const info = normalizedTenantNo
          ? await getTenantByTenantNo(normalizedTenantNo)
          : null;
      if (!mounted) {
        return;
      }

      if (!info) {
        navigate('/login', { replace: true });
        return;
      }

      setTenantNo(normalizedTenantNo);
      setLoginStep('id');

      const rememberedUserId = loadLastLoginUserId(normalizedTenantNo);
      if (rememberedUserId) {
        setUserId(rememberedUserId);
        setLoginStep('password');
      }

      const nextBrand = { tenantNm: info.tenantNm, logoImage: info.logoImage };
      setTenantBrand(nextBrand);
      persistTenantBrandCache(normalizedTenantNo, nextBrand);
    };

    void loadTenant();

    return () => {
      mounted = false;
    };
  }, [routeTenantNo, isAdminRoute, navigate, shouldSkipPrefill]);


  const logoSrc = resolveSafeLogoSrc(tenantBrand?.logoImage);
  // 기존 -> 도메인 경로 로그인 여부(isDomainScopedLogin)
  // 변경 -> 업체번호 경로 로그인 여부
  const isTenantScopedLogin = !!tenantNo && !isAdminRoute;
  const normalizedIdInput = userId.trim();
  // 기존 -> 도메인 로그인이면 아이디 뒤에 @도메인을 붙여 전송(effectiveUserId)
  // 변경 -> 아이디는 입력한 그대로 보내고 업체번호를 따로 보냄
  const effectiveTenantNo = isTenantScopedLogin
      ? tenantNo
      : normalizeTenantNo(tenantNoInput);
  const canSubmitIdStep = normalizedIdInput.length > 0;
  // 기존 -> 아이디와 비밀번호만 확인
  // 변경 -> 테넌트 로그인은 업체번호 6자리도 있어야 제출 가능
  const canSubmitPasswordStep =
      normalizedIdInput.length > 0 &&
      password.trim().length > 0 &&
      (isAdminRoute || effectiveTenantNo.length > 0);
  // 기존 -> tenantBrand 또는 tenantInfo의 업체명
  // 변경 -> tenantBrand의 업체명
  const tenantDisplayName = tenantBrand?.tenantNm?.trim() || '';
  const appLogoSrc = isDarkMode ? '/f1foodlink_wh.png' : '/f1foodlink_midd.png';
  const fallbackLogoSrc = appLogoSrc;
  const lightPalette = appTheme.palette;
  const fieldDefaultBorder = '1px solid #cbd5e1';
  const fieldFocusBorder = `1px solid ${lightPalette.primary.main}`;
  const fieldFocusShadow = `0 0 0 3px ${alpha(lightPalette.primary.main, 0.18)}`;
  // 업체번호 입력란과 비밀번호 입력란이 같이 쓰는 스타일
  const plainInputSx = {
    width: '100%',
    height: 56,
    borderRadius: 1.5,
    border: fieldDefaultBorder,
    outline: 0,
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
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
  } as const;
  // 기존 -> 업체명이 없으면 `${domain} 오피스에 로그인`
  // 변경 -> 업체명이 없으면 `업체번호 ${tenantNo} 로그인`
  const loginTitle = isAdminRoute
      ? '플랫폼 관리자 로그인'
      : tenantDisplayName
          ? `${tenantDisplayName}에 로그인`
          : isTenantScopedLogin
              ? `업체번호 ${tenantNo} 로그인`
              : APP_LABELS.pageTitle.login;
  const loginHelpText = isAdminRoute
      ? '중앙 관리자 계정으로 로그인하세요.'
      : isTenantScopedLogin
          ? loginStep === 'id'
              ? '로그인 ID를 입력하세요.'
              : '본인 확인을 위해 비밀번호를 입력하세요.'
          : APP_LABELS.message.loginHelp;

  useEffect(() => {
    if (!isTenantScopedLogin || loginStep !== 'password') {
      return;
    }

    passwordInputRef.current?.focus();
  }, [isTenantScopedLogin, loginStep]);

  const performLogin = async () => {
    setError('');

    setIsLoading(true);
    try {
      // 변경 -> 아이디는 입력값 그대로, 테넌트 로그인은 업체번호 전송
      const result = isAdminRoute
          ? await loginPlatformAdmin({
            userId: normalizedIdInput,
            password,
          })
          : await login({
            userId: normalizedIdInput,
            password,
            tenantNo: effectiveTenantNo,
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
      if (!isAdminRoute) {
        persistLastLoginTenantNo(effectiveTenantNo);
        persistLastLoginUserId(effectiveTenantNo, normalizedIdInput);
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

    if (isTenantScopedLogin && loginStep === 'id') {
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
      {!isTenantScopedLogin && (
        <Box
          component="img"
          src={appLogoSrc}
          alt="F1FoodLink"
          sx={{
            position: 'absolute',
            top: 30,
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
                  {!logoSrc && isTenantScopedLogin && (
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

                {/*{!domain && recommendedDomain && (*/}
                {/*  <Alert*/}
                {/*    severity="info"*/}
                {/*    action={*/}
                {/*      <Button*/}
                {/*        color="inherit"*/}
                {/*        size="small"*/}
                {/*        onClick={applyRecommendedDomain}*/}
                {/*      >*/}
                {/*        적용*/}
                {/*      </Button>*/}
                {/*    }*/}
                {/*  >*/}
                {/*    최근 로그인 도메인: {recommendedDomain}*/}
                {/*  </Alert>*/}
                {/*)}*/}

                <Stack spacing={1.9}>
                  {!isTenantScopedLogin && !isAdminRoute && (
                      <Box
                          component="input"
                          value={tenantNoInput}
                          onChange={(e) =>
                              setTenantNoInput(
                                  e.target.value.replace(/\D/g, '').slice(0, 6),
                              )
                          }
                          inputMode="numeric"
                          maxLength={6}
                          disabled={isLoading}
                          placeholder="업체번호 6자리"
                          aria-label="업체번호"
                          sx={plainInputSx}
                      />
                  )}
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
                      onChange={(e) => setUserId(e.target.value)}
                      disabled={isLoading}
                      readOnly={isTenantScopedLogin && loginStep === 'password'}
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
                    {/*{isTenantScopedLogin && (*/}
                    {/*  <Typography sx={{ color: '#64748b', fontSize: 15 }}>*/}
                    {/*    @{domain}*/}
                    {/*  </Typography>*/}
                    {/*)}*/}
                  </Box>

                  {(!isTenantScopedLogin || loginStep === 'password') && (
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
                      sx={plainInputSx}
                      // sx={{
                      //   width: '100%',
                      //   height: 56,
                      //   borderRadius: 1.5,
                      //   border: fieldDefaultBorder,
                      //   outline: 0,
                      //   transition:
                      //     'border-color 0.16s ease, box-shadow 0.16s ease',
                      //   backgroundColor: '#ffffff',
                      //   px: 1.6,
                      //   boxSizing: 'border-box',
                      //   fontSize: 16,
                      //   color: '#0f172a',
                      //   '&:focus': {
                      //     border: fieldFocusBorder,
                      //     boxShadow: fieldFocusShadow,
                      //   },
                      //   '&::placeholder': {
                      //     color: '#94a3b8',
                      //   },
                      // }}
                    />
                  )}
                </Stack>

                {/*{tenantInfo?.tenantCode && (*/}
                {/*  <Typography*/}
                {/*    sx={{*/}
                {/*      textAlign: 'center',*/}
                {/*      fontSize: 12,*/}
                {/*      color: lightPalette.primary.dark,*/}
                {/*      fontWeight: 600,*/}
                {/*    }}*/}
                {/*  >*/}
                {/*    업체 코드: {tenantInfo.tenantCode}*/}
                {/*  </Typography>*/}
                {/*)}*/}

                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    if (isTenantScopedLogin && loginStep === 'id') {
                      handleNextStep();
                      return;
                    }

                    void performLogin();
                  }}
                  disabled={
                    isLoading ||
                    (isTenantScopedLogin && loginStep === 'id'
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
                  ) : isTenantScopedLogin && loginStep === 'id' ? (
                    '다음'
                  ) : (
                    APP_LABELS.action.login
                  )}
                </Box>

                {isTenantScopedLogin && (
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
                              // 기존 -> state: skipAutoDomainRedirect
                              // 변경 -> /login에서 미리 채우기 생략
                              navigate('/login', {
                                replace: true,
                                state: { skipPrefill: true },
                              });
                            }}
                            sx={{
                              px: 0,
                              minWidth: 'auto',
                              textTransform: 'none',
                              color: lightPalette.primary.main,
                            }}
                        >
                          {/* 기존 -> 다른 도메인으로 로그인 / 변경 -> 다른 업체번호로 로그인 */}
                          다른 업체번호로 로그인
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
              공지사항 - 업체번호로 로그인할 수 있습니다.
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
