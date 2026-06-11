import { Alert, Grid, Paper, Stack, Typography } from '@mui/material';
import type {
  PlatformAdminCcpDocuments,
  PlatformAdminDashboardKpis,
  PlatformAdminTenantList,
  TenantCodeIssuanceSummary,
} from '../../../services/dashboardService';
import { APP_LABELS } from '../../../shared/ui/labels';

type PlatformAdminPanelsProps = {
  kpis: PlatformAdminDashboardKpis;
  tenantCodeIssuance: TenantCodeIssuanceSummary;
  tenantList: PlatformAdminTenantList;
  ccpDocuments: PlatformAdminCcpDocuments;
};

function PanelCard({
  title,
  primary,
  secondary,
}: {
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
        {primary}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {secondary}
      </Typography>
    </Paper>
  );
}

function SectionPaper({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Alert severity="info" sx={{ mt: 1.25 }}>
        {summary}
      </Alert>
    </Paper>
  );
}

export function PlatformAdminPanels({
  kpis,
  tenantCodeIssuance,
  tenantList,
  ccpDocuments,
}: PlatformAdminPanelsProps) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <PanelCard
            title={APP_LABELS.dashboard.platformAdmin.kpi.activeTenants}
            primary={String(kpis.activeTenants)}
            secondary={`${APP_LABELS.dashboard.platformAdmin.kpi.newTenantsLast7Days}: ${kpis.newTenantsLast7Days}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <PanelCard
            title={APP_LABELS.dashboard.platformAdmin.kpi.newTenantsLast7Days}
            primary={String(kpis.newTenantsLast7Days)}
            secondary={APP_LABELS.dashboard.platformAdmin.kpi.activeTenants}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <PanelCard
            title={APP_LABELS.dashboard.platformAdmin.kpi.ccpDocCompletionRate}
            primary={`${kpis.ccpDocCompletionRate}%`}
            secondary={`${APP_LABELS.dashboard.platformAdmin.kpi.tenantsWithoutCcpDocs}: ${kpis.tenantsWithoutCcpDocs}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <PanelCard
            title={APP_LABELS.dashboard.platformAdmin.kpi.tenantsWithoutCcpDocs}
            primary={String(kpis.tenantsWithoutCcpDocs)}
            secondary={APP_LABELS.dashboard.platformAdmin.kpi.ccpDocCompletionRate}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionPaper
            title={APP_LABELS.dashboard.platformAdmin.sections.tenantCodeIssuance}
            summary={`${APP_LABELS.dashboard.platformAdmin.summary.totalIssued}: ${tenantCodeIssuance.totalIssued} · ${APP_LABELS.dashboard.platformAdmin.summary.issuedThisWeek}: ${tenantCodeIssuance.issuedThisWeek}`}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionPaper
            title={APP_LABELS.dashboard.platformAdmin.sections.tenantList}
            summary={`${APP_LABELS.dashboard.platformAdmin.summary.totalTenants}: ${tenantList.summary.total} · ${APP_LABELS.dashboard.platformAdmin.summary.activeTenants}: ${tenantList.summary.active}`}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionPaper
            title={APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments}
            summary={`${APP_LABELS.dashboard.platformAdmin.summary.completionRate}: ${ccpDocuments.overall.completionRate}%`}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}