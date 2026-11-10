import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';

type TenantSummarySectionProps = {
  todayActionCount: number;
  approvalAlertCount: number;
  noticeCount: number;
  isLoading: boolean;
};

export function TenantSummarySection(props: TenantSummarySectionProps) {
  const { todayActionCount, approvalAlertCount, noticeCount, isLoading } =
    props;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        // 기존 -> isDarkMode 로 색 분기 / 변경 -> dashboard 토큰
        borderColor: 'dashboard.cardBorder',
        background: (theme) => theme.palette.dashboard.summaryBg,
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
