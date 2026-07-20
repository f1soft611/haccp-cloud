import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type TenantSummarySectionProps = {
  todayActionCount: number;
  approvalAlertCount: number;
  noticeCount: number;
  isLoading: boolean;
};

export function TenantSummarySection(props: TenantSummarySectionProps) {
  const { todayActionCount, approvalAlertCount, noticeCount, isLoading } =
    props;
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: isDarkMode
          ? 'rgba(20,184,166,0.4)'
          : 'rgba(20,184,166,0.28)',
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.35), rgba(15, 23, 42, 0.35))'
          : 'linear-gradient(135deg, rgba(15,118,110,0.1), rgba(20,184,166,0.04))',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          {isLoading ? (
            <>
              <Skeleton variant="text" width={220} height={36} />
              <Skeleton variant="text" width={320} height={24} />
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight={800}>
                오늘의 작업 대시보드
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                주기별 점검 업무와 결재 대기 항목을 한 화면에서 확인하세요.
              </Typography>
            </>
          )}
        </Box>

        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          {isLoading ? (
            <>
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={90} height={32} />
            </>
          ) : (
            <>
              <Chip
                label={`금일 조치 ${todayActionCount}건`}
                color="error"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`결재 대기 ${approvalAlertCount}건`}
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`공지 ${noticeCount}건`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
