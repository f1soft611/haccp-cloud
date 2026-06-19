import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth/authService';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';

export function LoginPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const [tenantCode, setTenantCode] = useState('TENANT-A');
  const [userId, setUserId] = useState('tenant_admin');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const result = await login({ tenantCode, userId, password });
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
    } catch (error) {
      setError(extractApiErrorMessage(error, APP_LABELS.message.loginFailed));
    }
  };

  return (
    <Box
      data-testid="login-page-shell"
      data-theme-mode={theme.palette.mode}
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      px={2}
      sx={{
        background: isDarkMode
          ? 'radial-gradient(circle at 18% 20%, rgba(20,184,166,0.18) 0%, transparent 34%), radial-gradient(circle at 82% 10%, rgba(45,212,191,0.12) 0%, transparent 36%), linear-gradient(135deg, #0f172a 0%, #111827 48%, #10261f 100%)'
          : 'radial-gradient(circle at 18% 20%, #d9f99d 0%, transparent 38%), radial-gradient(circle at 82% 10%, #99f6e4 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #ecfeff 48%, #f0fdf4 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 4,
          border: isDarkMode
            ? '1px solid rgba(45, 212, 191, 0.24)'
            : '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: isDarkMode
            ? '0 28px 64px rgba(2, 6, 23, 0.42)'
            : '0 28px 64px rgba(15, 23, 42, 0.18)',
          bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.86)' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : 'inherit',
          backdropFilter: 'blur(8px)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.25}>
            <Typography
              component="p"
              sx={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: isDarkMode ? '#5eead4' : '#0f766e',
                textTransform: 'uppercase',
                fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
              }}
            >
              Tenant Portal
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
              }}
            >
              {APP_LABELS.pageTitle.login}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                lineHeight: 1.6,
                color: isDarkMode ? 'rgba(248,250,252,0.78)' : undefined,
              }}
            >
              {APP_LABELS.message.loginHelp}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={APP_LABELS.field.tenantCode}
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              fullWidth
              slotProps={
                isDarkMode
                  ? {
                      inputLabel: {
                        sx: { color: 'rgba(248, 250, 252, 0.82)' },
                      },
                      input: {
                        sx: {
                          color: '#f8fafc',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(45, 212, 191, 0.34)',
                          },
                        },
                      },
                    }
                  : undefined
              }
            />
            <TextField
              label={APP_LABELS.field.userId}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              fullWidth
              slotProps={
                isDarkMode
                  ? {
                      inputLabel: {
                        sx: { color: 'rgba(248, 250, 252, 0.82)' },
                      },
                      input: {
                        sx: {
                          color: '#f8fafc',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(45, 212, 191, 0.34)',
                          },
                        },
                      },
                    }
                  : undefined
              }
            />
            <TextField
              type="password"
              label={APP_LABELS.field.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              slotProps={
                isDarkMode
                  ? {
                      inputLabel: {
                        sx: { color: 'rgba(248, 250, 252, 0.82)' },
                      },
                      input: {
                        sx: {
                          color: '#f8fafc',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(45, 212, 191, 0.34)',
                          },
                        },
                      },
                    }
                  : undefined
              }
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                mt: 0.5,
                py: 1.2,
                fontWeight: 700,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)'
                  : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              }}
            >
              {APP_LABELS.action.login}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login/platform')}
              sx={{ fontWeight: 700 }}
            >
              {APP_LABELS.action.platformAdminLogin}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
