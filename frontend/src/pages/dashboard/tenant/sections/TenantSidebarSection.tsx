import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NOTICE_ITEMS } from '../constants';

// 기존 -> 결재 알림(approvalAlerts) + 공지사항 두 패널 표시
// 변경 -> 결재 알림 패널 제거, 공지사항만 표시
export function TenantSidebarSection() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Stack spacing={2}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isDarkMode
            ? 'rgba(20,184,166,0.4)'
            : 'rgba(20,184,166,0.24)',
          bgcolor: isDarkMode
            ? 'rgba(6, 30, 28, 0.9)'
            : 'rgba(240, 253, 250, 0.9)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" fontWeight={800}>
            공지사항
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            더 보기 -&gt;
          </Typography>
        </Stack>

        <Stack spacing={1.15} sx={{ mt: 1.2 }}>
          {NOTICE_ITEMS.map((notice) => (
            <Box
              key={notice.id}
              sx={{
                pl: 1.15,
                pr: 1,
                py: 0.8,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: isDarkMode
                  ? 'rgba(148,163,184,0.24)'
                  : 'rgba(15,23,42,0.12)',
                bgcolor: isDarkMode
                  ? 'rgba(15,23,42,0.88)'
                  : 'rgba(255,255,255,0.8)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 4,
                  borderRadius: 2,
                  bgcolor:
                    notice.scope === '플랫폼'
                      ? 'rgba(14,116,144,0.9)'
                      : 'rgba(13,148,136,0.9)',
                },
              }}
            >
              <Stack
                direction="row"
                spacing={0.8}
                alignItems="center"
                justifyContent="space-between"
              >
                <Chip
                  size="small"
                  label={notice.scope}
                  color={notice.scope === '플랫폼' ? 'primary' : 'success'}
                  sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {notice.date}
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{ mt: 0.55, fontWeight: 650, lineHeight: 1.5 }}
              >
                {notice.title}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
