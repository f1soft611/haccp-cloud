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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

export function LoginPage() {
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
        role: result.role,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        loginHistoryId: result.loginHistoryId,
        onboardingRequired: result.onboardingRequired,
        onboardingStatus: result.onboardingStatus,
      });
      navigate('/dashboard', { replace: true });
    } catch {
      setError(APP_LABELS.message.loginFailed);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">{APP_LABELS.pageTitle.login}</Typography>
            <Typography color="text.secondary">
              {APP_LABELS.message.loginHelp}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={APP_LABELS.field.tenantCode}
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
            />
            <TextField
              label={APP_LABELS.field.userId}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <TextField
              type="password"
              label={APP_LABELS.field.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="contained" onClick={handleLogin}>
              {APP_LABELS.action.login}
            </Button>
            <Button variant="text" onClick={() => navigate('/login/platform')}>
              {APP_LABELS.action.platformAdminLogin}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
