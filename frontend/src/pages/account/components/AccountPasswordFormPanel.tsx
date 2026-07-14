import { Alert, Button, Paper, Stack, TextField } from '@mui/material';
import { APP_LABELS } from '../../../shared/constants/labels';

type AccountPasswordFormPanelProps = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
  submitDisabled: boolean;
  isSubmitting: boolean;
  noticeMessage?: string;
  errorMessage?: string;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNextPassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function AccountPasswordFormPanel({
  currentPassword,
  nextPassword,
  confirmPassword,
  submitDisabled,
  isSubmitting,
  noticeMessage,
  errorMessage,
  onChangeCurrentPassword,
  onChangeNextPassword,
  onChangeConfirmPassword,
  onSubmit,
  onCancel,
}: AccountPasswordFormPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Stack spacing={2}>
        {noticeMessage ? (
          <Alert severity="success">{noticeMessage}</Alert>
        ) : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        <Alert severity="info">
          현재 비밀번호 확인 후 새 비밀번호를 적용합니다.
        </Alert>
        <TextField
          type="password"
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(event) => onChangeCurrentPassword(event.target.value)}
          autoComplete="current-password"
          fullWidth
        />
        <TextField
          type="password"
          label="새 비밀번호"
          value={nextPassword}
          onChange={(event) => onChangeNextPassword(event.target.value)}
          autoComplete="new-password"
          fullWidth
        />
        <TextField
          type="password"
          label="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(event) => onChangeConfirmPassword(event.target.value)}
          autoComplete="new-password"
          fullWidth
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={submitDisabled}
            onClick={onSubmit}
          >
            {APP_LABELS.action.save}
          </Button>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
