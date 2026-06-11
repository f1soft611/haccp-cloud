import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import {
  getPlatformAdminDashboardKpis,
  listPlatformAdminCcpDocuments,
  listPlatformAdminTenantCodeIssuance,
  listPlatformAdminTenants,
} from '../../../services/dashboardService';
import { APP_LABELS } from '../../../shared/ui/labels';
import { PlatformAdminPanels } from './PlatformAdminPanels';

export function PlatformAdminDashboard() {
  const [
    kpisQuery,
    tenantCodeIssuanceQuery,
    tenantListQuery,
    ccpDocumentsQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ['platform-admin-dashboard', 'kpis'],
        queryFn: getPlatformAdminDashboardKpis,
      },
      {
        queryKey: ['platform-admin-dashboard', 'tenant-code-issuance'],
        queryFn: listPlatformAdminTenantCodeIssuance,
      },
      {
        queryKey: ['platform-admin-dashboard', 'tenants'],
        queryFn: listPlatformAdminTenants,
      },
      {
        queryKey: ['platform-admin-dashboard', 'ccp-documents'],
        queryFn: listPlatformAdminCcpDocuments,
      },
    ],
  });

  const isLoading =
    kpisQuery.isLoading ||
    tenantCodeIssuanceQuery.isLoading ||
    tenantListQuery.isLoading ||
    ccpDocumentsQuery.isLoading;

  const isError =
    kpisQuery.isError ||
    tenantCodeIssuanceQuery.isError ||
    tenantListQuery.isError ||
    ccpDocumentsQuery.isError;

  const kpis = kpisQuery.data ?? {
    activeTenants: 0,
    newTenantsLast7Days: 0,
    ccpDocCompletionRate: 0,
    tenantsWithoutCcpDocs: 0,
  };

  const tenantCodeIssuance = tenantCodeIssuanceQuery.data ?? {
    totalIssued: 0,
    issuedThisMonth: 0,
    issuedThisWeek: 0,
    recentIssues: [],
  };

  const tenantList = tenantListQuery.data ?? {
    summary: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    items: [],
  };

  const ccpDocuments = ccpDocumentsQuery.data ?? {
    overall: {
      completionRate: 0,
      completedTenants: 0,
      totalTenants: 0,
    },
    items: [],
  };

  return (
    <Stack spacing={2} data-testid="platform-admin-dashboard">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={800}>
          {APP_LABELS.dashboard.platformAdmin.title}
        </Typography>
        {isLoading ? <CircularProgress size={20} /> : null}
      </Stack>

      {isError ? (
        <Alert severity="warning">
          {APP_LABELS.dashboard.platformAdmin.errorMessage}
        </Alert>
      ) : null}

      <PlatformAdminPanels
        kpis={kpis}
        tenantCodeIssuance={tenantCodeIssuance}
        tenantList={tenantList}
        ccpDocuments={ccpDocuments}
        onRetryKpis={() => {
          void kpisQuery.refetch();
        }}
        onRetryTenantCodeIssuance={() => {
          void tenantCodeIssuanceQuery.refetch();
        }}
        onRetryTenantList={() => {
          void tenantListQuery.refetch();
        }}
        onRetryCcpDocuments={() => {
          void ccpDocumentsQuery.refetch();
        }}
      />
    </Stack>
  );
}
