import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NOTICE_ITEMS } from '../constants';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import { formatDate } from '../utils';

type TenantSidebarSectionProps = {
  approvalAlerts: TenantTodoCardItem[];
  isLoading: boolean;
  isError: boolean;
};

export function TenantSidebarSection(props: TenantSidebarSectionProps) {
  const { approvalAlerts, isLoading, isError } = props;
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
            ? 'rgba(245, 158, 11, 0.45)'
            : 'rgba(245, 158, 11, 0.35)',
          bgcolor: isDarkMode
            ? 'rgba(30, 21, 8, 0.9)'
            : 'rgba(255, 251, 235, 0.88)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={800}>
            결재 알림
          </Typography>
          <Chip
            size="small"
            label={String(approvalAlerts.length)}
            color={approvalAlerts.length > 0 ? 'warning' : 'default'}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
        <Stack spacing={0.8} sx={{ mt: 1.1 }}>
          {isLoading ? (
            <>
              <Skeleton variant="rounded" height={52} />
              <Skeleton variant="rounded" height={52} />
            </>
          ) : approvalAlerts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {isError
                ? '결재 알림을 불러오지 못했습니다.'
                : '현재 결재 대상 업무가 없습니다.'}
            </Typography>
          ) : (
            approvalAlerts.map((item) => (
              <Box
                key={`approval-${item.id}`}
                sx={{
                  px: 1,
                  py: 0.9,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: isDarkMode
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'rgba(245, 158, 11, 0.35)',
                  bgcolor: isDarkMode
                    ? 'rgba(17,24,39,0.85)'
                    : 'rgba(255,255,255,0.7)',
                }}
              >
                <Typography variant="body2" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  요청자: {item.updatedBy || '없음'} · 요청일:{' '}
                  {formatDate(item.updatedAt)}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Paper>

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
