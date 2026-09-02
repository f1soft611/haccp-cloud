import { Grid, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NOTICE_ITEMS } from './constants';
import { useTenantDashboardData } from './hooks/useTenantDashboardData';
import { TenantKpiSection } from './sections/TenantKpiSection';
import { TenantSidebarSection } from './sections/TenantSidebarSection';
import { TenantSummarySection } from './sections/TenantSummarySection';
import { TenantTodoSection } from './sections/TenantTodoSection';

export function TenantDashboard() {
    const navigate = useNavigate();
    const {
        ccpCompletion,
        uncheckedCount,
        draftDocuments,
        todayActionCount,
        todoSections,
        approvalAlerts,
        isMetricsLoading,
        isTodoLoading,
        isTodoError,
    } = useTenantDashboardData();

  return (
    <Stack spacing={2.25}>
      <TenantSummarySection
        todayActionCount={todayActionCount}
        approvalAlertCount={approvalAlerts.length}
        noticeCount={NOTICE_ITEMS.length}
        isLoading={isMetricsLoading || isTodoLoading}
      />

      <TenantKpiSection
        ccpCompletion={ccpCompletion}
        uncheckedCount={uncheckedCount}
        draftDocuments={draftDocuments}
        todayActionCount={todayActionCount}
        isLoading={isMetricsLoading}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TenantTodoSection
            isLoading={isTodoLoading}
            isError={isTodoError}
            sections={todoSections}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
            <TenantSidebarSection
                approvalAlerts={approvalAlerts}
                isLoading={isTodoLoading}
                isError={isTodoError}
                onOpenCalendar={() => navigate('/docs/work-calendar')}
            />
        </Grid>
      </Grid>
    </Stack>
  );
}
