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
import { loginPlatformAdmin } from '../services/authService';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

export function PlatformAdminLoginPage() {
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
      navigate('/dashboard', { replace: true });
    } catch {
      setError(APP_LABELS.message.platformAdminLoginFailed);
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
            <Typography variant="h4">
              {APP_LABELS.pageTitle.platformAdminLogin}
            </Typography>
            <Typography color="text.secondary">
              {APP_LABELS.message.platformAdminLoginHelp}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={APP_LABELS.field.userId}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
            <TextField
              type="password"
              label={APP_LABELS.field.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button variant="contained" onClick={handleLogin}>
              {APP_LABELS.action.platformAdminLogin}
            </Button>
            <Button variant="text" onClick={() => navigate('/login')}>
              {APP_LABELS.action.tenantLogin}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
