import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  Button,
  Box,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { APP_LABELS } from '../../../../shared/constants/labels';
import type { TenantTodoSectionModel } from '../hooks/useTenantDashboardData';
import { formatDate, getWorkCycleLabel, getWorkCycleSx } from '../utils';

type TenantTodoSectionProps = {
  isLoading: boolean;
  isError: boolean;
  sections: TenantTodoSectionModel[];
};

export function TenantTodoSection(props: TenantTodoSectionProps) {
  const { isLoading, isError, sections } = props;
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        p: 2.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={0.75}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="h6" fontWeight={800}>
              {APP_LABELS.dashboard.blocks.todos}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            업무 분류별 우선업무와 주기를 함께 표시합니다.
          </Typography>
        </Stack>

        {isLoading ? <CircularProgress size={18} /> : null}

        <Grid container spacing={1.2}>
          {isLoading ? (
            [1, 2, 3].map((skeletonId) => (
              <Grid key={`todo-skeleton-${skeletonId}`} size={{ xs: 12 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    height: '100%',
                    borderColor: isDarkMode
                      ? 'rgba(148,163,184,0.24)'
                      : 'rgba(15,23,42,0.12)',
                    background: isDarkMode
                      ? 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))'
                      : 'linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,0.95))',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <Skeleton variant="text" width={140} height={28} />
                    <Skeleton variant="rounded" width={36} height={22} />
                  </Stack>
                  <Stack spacing={0.7} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" height={64} />
                    <Skeleton variant="rounded" height={64} />
                  </Stack>
                </Paper>
              </Grid>
            ))
          ) : sections.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.8,
                  borderRadius: 2,
                  borderColor: isDarkMode
                    ? 'rgba(148,163,184,0.24)'
                    : 'rgba(15,23,42,0.12)',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {isError
                    ? '할일 목록을 불러오지 못했습니다.'
                    : '등록된 업무가 없습니다.'}
                </Typography>
              </Paper>
            </Grid>
          ) : (
            sections.map((section) => {
              const items = section.items;

              return (
                <Grid key={section.key} size={{ xs: 12 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      height: '100%',
                      borderColor: isDarkMode
                        ? 'rgba(148,163,184,0.24)'
                        : 'rgba(15,23,42,0.12)',
                      background: isDarkMode
                        ? 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))'
                        : 'linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,0.95))',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {section.label}
                      </Typography>
                      <Chip
                        size="small"
                        label={String(items.length)}
                        sx={{ height: 22, fontWeight: 800 }}
                      />
                    </Stack>

                    <Stack spacing={0.7} sx={{ mt: 1 }}>
                      {items.map((item) => {
                        const statusLabel =
                          item.approvalStatusTypeName ||
                          (item.status === 'ACTIVE'
                            ? '승인'
                            : item.status === 'IN_PROGRESS'
                              ? '결재중'
                              : item.writtenInCycle
                                ? '임시저장'
                                : '미완료');
                        const statusColor:
                          | 'success'
                          | 'warning'
                          | 'info'
                          | 'secondary'
                          | 'error' =
                          statusLabel === '승인'
                            ? 'success'
                            : statusLabel === '결재중'
                              ? 'warning'
                              : statusLabel === '임시저장'
                                ? 'info'
                                : statusLabel === '반송'
                                  ? 'secondary'
                                  : 'error';

                        return (
                          <Box
                            key={`${section.key}-${item.id}`}
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: isDarkMode
                                ? 'rgba(148,163,184,0.24)'
                                : 'rgba(15,23,42,0.1)',
                              bgcolor: 'background.paper',
                            }}
                          >
                            {(() => {
                              const cycleLabel = getWorkCycleLabel(item);

                              return (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1}
                                  sx={{ mb: 0.4 }}
                                >
                                  <Chip
                                    size="small"
                                    label={`주기 ${cycleLabel}`}
                                    sx={{
                                      height: 22,
                                      fontWeight: 700,
                                      ...getWorkCycleSx(cycleLabel),
                                    }}
                                  />
                                  {item.status === 'ACTIVE' ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      완료일 {formatDate(item.updatedAt)}
                                    </Typography>
                                  ) : null}
                                </Stack>
                              );
                            })()}

                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="body2" fontWeight={700}>
                                {item.category || 'HACCP'}
                              </Typography>
                              <Chip
                                size="small"
                                label={statusLabel}
                                color={statusColor}
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                              sx={{ mt: 0.6 }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {item.title}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={0.6}
                                alignItems="center"
                              >
                                <Tooltip title="작성하러 가기">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    aria-label="작성하러 가기"
                                    onClick={() => {
                                      const query =
                                        item.routeIdType === 'approval'
                                          ? '?idType=approval'
                                          : '?idType=work';
                                      navigate(
                                        `/approvals/draft/${item.routeId}${query}`,
                                      );
                                    }}
                                  >
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  endIcon={<ArrowForwardRoundedIcon />}
                                  onClick={() => navigate('/docs/haccp-base')}
                                >
                                  현황 이동
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
      </Stack>
    </Paper>
  );
}
