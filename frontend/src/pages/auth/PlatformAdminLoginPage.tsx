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
import { loginPlatformAdmin } from '../../services/auth/authService';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import { useAuthStore } from '../../shared/store/authStore';
import { APP_LABELS } from '../../shared/constants/labels';

export function PlatformAdminLoginPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const [userId, setUserId] = useState('platform_admin');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    try {
      const result = await loginPlatformAdmin({ userId, password });
      setAuth({
        tenantCode: result.tenantCode,
        userId: result.userId,
        role: result.role,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        loginHistoryId: result.loginHistoryId,
        onboardingRequired: result.onboardingRequired,
        onboardingStatus: result.onboardingStatus,
      });
      navigate('/platform', { replace: true });
    } catch (error) {
      setError(
        extractApiErrorMessage(
          error,
          APP_LABELS.message.platformAdminLoginFailed,
        ),
      );
      navigate('/login/platform', { replace: true });
    }
  };

  return (
    <Box
      data-testid="platform-login-page-shell"
      data-theme-mode={theme.palette.mode}
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      px={2}
      sx={{
        background: isDarkMode
          ? 'radial-gradient(circle at 80% 12%, #fde68a 0%, transparent 35%), radial-gradient(circle at 22% 82%, #fecaca 0%, transparent 38%), linear-gradient(130deg, #0f172a 0%, #1f2937 46%, #111827 100%)'
          : 'radial-gradient(circle at 78% 12%, rgba(251,191,36,0.24) 0%, transparent 32%), radial-gradient(circle at 20% 78%, rgba(249,115,22,0.16) 0%, transparent 34%), linear-gradient(135deg, #fffaf0 0%, #fff7ed 48%, #fffbeb 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 4,
          border: isDarkMode
            ? '1px solid rgba(251, 191, 36, 0.45)'
            : '1px solid rgba(251, 191, 36, 0.28)',
          boxShadow: isDarkMode
            ? '0 28px 70px rgba(0, 0, 0, 0.45)'
            : '0 28px 64px rgba(120, 53, 15, 0.14)',
          bgcolor: isDarkMode
            ? 'rgba(17, 24, 39, 0.9)'
            : 'rgba(255,255,255,0.92)',
          color: isDarkMode ? '#f8fafc' : '#111827',
          backdropFilter: 'blur(10px)',
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
                color: '#fbbf24',
                textTransform: 'uppercase',
                fontFamily: 'Pretendard, SUIT, Noto Sans KR, sans-serif',
              }}
            >
              Platform Control Room
            </Typography>
            <Typography variant="h4">
              {APP_LABELS.pageTitle.platformAdminLogin}
            </Typography>
            <Typography
              sx={{
                color: isDarkMode
                  ? 'rgba(248, 250, 252, 0.78)'
                  : 'rgba(17, 24, 39, 0.74)',
              }}
            >
              {APP_LABELS.message.platformAdminLoginHelp}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={APP_LABELS.field.userId}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              fullWidth
              slotProps={{
                inputLabel: {
                  sx: {
                    color: isDarkMode
                      ? 'rgba(248, 250, 252, 0.82)'
                      : 'rgba(17, 24, 39, 0.72)',
                  },
                },
                input: {
                  sx: {
                    color: isDarkMode ? '#f8fafc' : '#111827',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode
                        ? 'rgba(251, 191, 36, 0.45)'
                        : 'rgba(251, 191, 36, 0.34)',
                    },
                  },
                },
              }}
            />
            <TextField
              type="password"
              label={APP_LABELS.field.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              slotProps={{
                inputLabel: {
                  sx: {
                    color: isDarkMode
                      ? 'rgba(248, 250, 252, 0.82)'
                      : 'rgba(17, 24, 39, 0.72)',
                  },
                },
                input: {
                  sx: {
                    color: isDarkMode ? '#f8fafc' : '#111827',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode
                        ? 'rgba(251, 191, 36, 0.45)'
                        : 'rgba(251, 191, 36, 0.34)',
                    },
                  },
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                mt: 0.5,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 800,
                color: '#1f2937',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              }}
            >
              {APP_LABELS.action.platformAdminLogin}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{
                color: isDarkMode ? '#fde68a' : '#b45309',
                fontWeight: 700,
              }}
            >
              {APP_LABELS.action.tenantLogin}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
