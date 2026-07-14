import {
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type MyPageAccountInfoPanelProps = {
  visibleName: string;
  visibleEmail: string;
  visibleDepartment: string;
  visibleRole: string;
  resolvedLoginId: string;
  isLoading: boolean;
  isError: boolean;
};

export function MyPageAccountInfoPanel({
  visibleName,
  visibleEmail,
  visibleDepartment,
  visibleRole,
  resolvedLoginId,
  isLoading,
  isError,
}: MyPageAccountInfoPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Stack spacing={2.25}>
        <Typography variant="h6" fontWeight={800}>
          계정 정보
        </Typography>
        <Typography variant="caption" color="text.secondary">
          계정 정보 항목은 읽기 전용입니다.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="이름"
              value={visibleName}
              fullWidth
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="이메일"
              value={visibleEmail}
              fullWidth
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="부서"
              value={visibleDepartment}
              fullWidth
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="권한"
              value={visibleRole}
              fullWidth
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="로그인 아이디"
              value={resolvedLoginId || '미등록'}
              fullWidth
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              계정 정보를 불러오는 중입니다.
            </Typography>
          </Stack>
        ) : null}

        {isError ? (
          <Alert severity="warning">
            마이페이지 정보를 불러오지 못했습니다. 로그인 정보로 대체
            표시합니다.
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
