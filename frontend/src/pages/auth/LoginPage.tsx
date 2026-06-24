import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth/authService';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import {
  getTenantByDomain,
  type TenantDomainInfo,
} from '../../services/tenant/tenantService';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';

function resolveDomainFromLocation(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  const pathDomain = window.location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.trim().toLowerCase())
    .find((segment) => segment.includes('.'));

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return hostname;
  }

  return pathDomain ?? '';
}

export function LoginPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<TenantDomainInfo | null>(null);
  const [tenantCode, setTenantCode] = useState('');
  const [domain, setDomain] = useState('');
  const [domainLoaded, setDomainLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTenant = async () => {
      const resolvedDomain = resolveDomainFromLocation();
      if (!mounted) {
        return;
      }

      setDomain(resolvedDomain);

      if (!resolvedDomain) {
        setDomainLoaded(true);
        return;
      }

      try {
        const info = await getTenantByDomain(resolvedDomain);
        if (!mounted) {
          return;
        }

        setTenantInfo(info);
        if (info?.tenantCode) {
          setTenantCode(info.tenantCode);
        }
      } catch {
        if (!mounted) {
          return;
        }

        setTenantInfo(null);
      } finally {
        if (mounted) {
          setDomainLoaded(true);
        }
      }
    };

    void loadTenant();

    return () => {
      mounted = false;
    };
  }, []);

  const performLogin = async () => {
    setError('');

    setIsLoading(true);
    try {
      const result = await login({ userId, password, tenantCode });

      setAuth({
        tenantCode: result.tenantCode,
        userId: result.userId,
        displayName: result.displayName,
        role: result.role,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        loginHistoryId: result.loginHistoryId,
        onboardingRequired: result.onboardingRequired,
        onboardingStatus: result.onboardingStatus,
      });
      navigate(result.role === 'PLATFORM_ADMIN' ? '/platform' : '/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(extractApiErrorMessage(err, APP_LABELS.message.loginFailed));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      data-testid="login-page-shell"
      data-theme-mode={theme.palette.mode}
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      px={2}
      sx={{
        position: 'relative',
        backgroundColor: isDarkMode
          ? theme.palette.background.default
          : theme.palette.grey[100],
      }}
    >
      <Typography
        component="p"
        sx={{
          position: 'absolute',
          top: 14,
          left: { xs: 16, md: 'calc(50% - 470px)' },
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: isDarkMode
            ? theme.palette.primary.light
            : theme.palette.primary.main,
          fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
        }}
      >
        HACCP
      </Typography>

      <Box
        sx={{
          width: '100%',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 6 },
        }}
      >
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 460 }}>
          <Card
            sx={{
              borderRadius: 2,
              border: isDarkMode
                ? '1px solid rgba(148,163,184,0.28)'
                : '1px solid #d7dce5',
              boxShadow: isDarkMode
                ? '0 12px 32px rgba(2, 6, 23, 0.45)'
                : '0 8px 24px rgba(15, 23, 42, 0.08)',
              bgcolor: isDarkMode ? '#0b1220' : '#ffffff',
            }}
          >
            <CardContent sx={{ px: 4, py: 5 }}>
              <Stack spacing={2.2}>
                <Box textAlign="center">
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
                      color: isDarkMode ? '#f8fafc' : '#111827',
                    }}
                  >
                    {APP_LABELS.pageTitle.login}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1.2,
                      fontSize: 15,
                      color: isDarkMode ? '#94a3b8' : '#4b5563',
                    }}
                  >
                    {APP_LABELS.message.loginHelp}
                  </Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <Stack spacing={1.5}>
                  <TextField
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isLoading}
                    placeholder="id@f1soft.co.kr"
                    inputProps={{ 'aria-label': APP_LABELS.field.userId }}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: isDarkMode ? '#111b2e' : '#ffffff',
                      },
                    }}
                  />
                  <TextField
                    type="password"
                    label={APP_LABELS.field.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: isDarkMode ? '#111b2e' : '#ffffff',
                      },
                    }}
                  />
                </Stack>

                {tenantInfo?.tenantCode && (
                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: isDarkMode ? '#93c5fd' : '#2563eb',
                      fontWeight: 600,
                    }}
                  >
                    업체 코드: {tenantInfo.tenantCode}
                  </Typography>
                )}

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => performLogin()}
                  disabled={isLoading}
                  sx={{
                    py: 1.15,
                    borderRadius: 1.5,
                    fontWeight: 700,
                    fontSize: 17,
                    textTransform: 'none',
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    APP_LABELS.action.login
                  )}
                </Button>
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
              border: isDarkMode
                ? '1px solid rgba(148,163,184,0.25)'
                : '1px solid rgba(148,163,184,0.35)',
              backgroundColor: isDarkMode
                ? 'rgba(15,23,42,0.45)'
                : 'rgba(255,255,255,0.9)',
              color: isDarkMode ? '#cbd5e1' : '#334155',
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
          pb: 1.2,
          textAlign: 'center',
          fontSize: 12,
          letterSpacing: '0',
          color: isDarkMode
            ? 'rgba(148,163,184,0.52)'
            : 'rgba(100,116,139,0.52)',
          fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
        }}
      >
        © F1soft Inc.
      </Typography>
    </Box>
  );
}
