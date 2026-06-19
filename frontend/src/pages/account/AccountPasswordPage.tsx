import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_LABELS } from '../../shared/constants/labels';

export function AccountPasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Paper sx={{ p: 3, maxWidth: 720 }} data-testid="account-password-page">
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          비밀번호 변경
        </Typography>
        <Alert severity="info">
          비밀번호 변경 API는 후속 작업에서 연결됩니다.
        </Alert>
        <TextField
          type="password"
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <TextField
          type="password"
          label="새 비밀번호"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
        />
        <TextField
          type="password"
          label="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled>
            {APP_LABELS.action.save}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            취소
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
