import { Grid, Paper, Skeleton, Typography } from '@mui/material';
import { APP_LABELS } from '../../../../shared/constants/labels';

function KpiCard({
  testId,
  title,
  value,
  hint,
  color,
}: {
  testId: string;
  title: string;
  value: string;
  hint: string;
  color?: string;
}) {
  return (
    <Paper
      data-testid={testId}
      sx={{
        p: 2.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {hint}
      </Typography>
    </Paper>
  );
}

type TenantKpiSectionProps = {
  ccpCompletion: number;
  uncheckedCount: number;
  draftDocuments: number;
  todayActionCount: number;
  isLoading: boolean;
};

export function TenantKpiSection(props: TenantKpiSectionProps) {
  const {
    ccpCompletion,
    uncheckedCount,
    draftDocuments,
    todayActionCount,
    isLoading,
  } = props;

  if (isLoading) {
    return (
      <Grid container spacing={1.5}>
        {[1, 2, 3, 4].map((id) => (
          <Grid key={id} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper
              sx={{
                p: 2.25,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={44} />
              <Skeleton variant="text" width="70%" height={22} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          testId="kpi-card-ccp-rate"
          title={APP_LABELS.dashboard.kpi.ccpCompletion}
          value={`${ccpCompletion}%`}
          hint="활성 문서 비율"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          testId="kpi-card-unchecked"
          title={APP_LABELS.dashboard.kpi.unchecked}
          value={String(uncheckedCount)}
          hint="금일 누락 점검"
          color="warning.main"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          testId="kpi-card-draft"
          title={APP_LABELS.dashboard.kpi.draftDocs}
          value={String(draftDocuments)}
          hint="검토 대기 상태"
          color="secondary.main"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          testId="kpi-card-today-action"
          title={APP_LABELS.dashboard.kpi.todayAction}
          value={String(todayActionCount)}
          hint="즉시 확인 필요"
          color="error.main"
        />
      </Grid>
    </Grid>
  );
}
