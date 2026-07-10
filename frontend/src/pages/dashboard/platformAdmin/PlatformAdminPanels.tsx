import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type {
  PlatformAdminCcpDocuments,
  PlatformAdminDashboardKpis,
  PlatformAdminTenantList,
  TenantCodeIssuanceSummary,
} from '../../../services/documents/dashboardService';
import type { UserRole } from '../../../shared/store/authStore';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PlatformAdminDashboardTopSection } from './PlatformAdminDashboardTopSection';

const MAX_ROWS = 5;

type PlatformAdminPanelsProps = {
  kpis: PlatformAdminDashboardKpis;
  tenantCodeIssuance: TenantCodeIssuanceSummary;
  tenantList: PlatformAdminTenantList;
  ccpDocuments: PlatformAdminCcpDocuments;
  onRetryKpis: () => void;
  onRetryTenantCodeIssuance: () => void;
  onRetryTenantList: () => void;
  onRetryCcpDocuments: () => void;
  loginRole: UserRole;
  isLoading?: boolean;
};

type KpiCardProps = {
  title: string;
  value: string;
  secondary: string;
  accentColor: string;
};

function KpiCard({ title, value, secondary, accentColor }: KpiCardProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `4px solid ${accentColor}`,
        height: '100%',
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h3" fontWeight={800} sx={{ color: accentColor }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: 'block' }}
      >
        {secondary}
      </Typography>
    </Paper>
  );
}

type SectionCardProps = {
  title: string;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
  children: React.ReactNode;
};

function SectionCard({
  title,
  isError,
  errorMessage,
  onRetry,
  children,
}: SectionCardProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {isError ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {APP_LABELS.action.retry}
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : (
        children
      )}
    </Paper>
  );
}

function StatusChip({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return (
    <Chip
      label={APP_LABELS.dashboard.platformAdmin.statusLabel[status]}
      size="small"
      color={status === 'ACTIVE' ? 'success' : 'default'}
      variant={status === 'ACTIVE' ? 'filled' : 'outlined'}
    />
  );
}

export function PlatformAdminPanels({
  kpis,
  tenantCodeIssuance,
  tenantList,
  ccpDocuments,
  onRetryKpis,
  onRetryTenantCodeIssuance,
  onRetryTenantList,
  onRetryCcpDocuments,
  loginRole,
  isLoading = false,
}: PlatformAdminPanelsProps) {
  const safeTenantSummary = tenantList?.summary ?? {
    total: 0,
    active: 0,
    inactive: 0,
  };
  const safeTenantItems = tenantList?.items ?? [];
  const safeRecentIssues = tenantCodeIssuance?.recentIssues ?? [];
  const safeCcpOverall = ccpDocuments?.overall ?? {
    completionRate: 0,
    completedTenants: 0,
    totalTenants: 0,
  };
  const safeCcpItems = ccpDocuments?.items ?? [];

  const hasKpiError = kpis.hasError === true;
  const hasTenantCodeIssuanceError = tenantCodeIssuance.hasError === true;
  const hasTenantListError = tenantList.hasError === true;
  const hasCcpDocumentsError = ccpDocuments.hasError === true;

  return (
    <Stack spacing={2.5}>
      <PlatformAdminDashboardTopSection loginRole={loginRole} />

      {/* 데이터 영역: 로딩 중이면 스켈레톤, 완료 후 실제 데이터 */}
      {isLoading ? (
        <Stack spacing={1.5} data-testid="platform-admin-dashboard-skeleton">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`platform-admin-kpi-skeleton-${index}`}
                variant="rounded"
                height={100}
                sx={{ flex: 1 }}
              />
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`platform-admin-section-skeleton-${index}`}
                variant="rounded"
                height={220}
                sx={{ flex: 1 }}
              />
            ))}
          </Stack>
        </Stack>
      ) : (
        <>
          {/* KPI 카드 */}
          {hasKpiError ? (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={onRetryKpis}>
                  {APP_LABELS.action.retry}
                </Button>
              }
            >
              핵심 지표 데이터를 불러오지 못했습니다.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  title={APP_LABELS.dashboard.platformAdmin.kpi.activeTenants}
                  value={String(kpis.activeTenants)}
                  secondary={`${APP_LABELS.dashboard.platformAdmin.kpi.newTenantsLast7Days}: ${kpis.newTenantsLast7Days}`}
                  accentColor="#1976d2"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  title={
                    APP_LABELS.dashboard.platformAdmin.kpi.newTenantsLast7Days
                  }
                  value={String(kpis.newTenantsLast7Days)}
                  secondary={`${APP_LABELS.dashboard.platformAdmin.summary.totalTenants}: ${safeTenantSummary.total}`}
                  accentColor="#2e7d32"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  title={
                    APP_LABELS.dashboard.platformAdmin.kpi.ccpDocCompletionRate
                  }
                  value={`${kpis.ccpDocCompletionRate}%`}
                  secondary={`${APP_LABELS.dashboard.platformAdmin.kpi.tenantsWithoutCcpDocs}: ${kpis.tenantsWithoutCcpDocs}`}
                  accentColor="#ed6c02"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  title={
                    APP_LABELS.dashboard.platformAdmin.kpi.tenantsWithoutCcpDocs
                  }
                  value={String(kpis.tenantsWithoutCcpDocs)}
                  secondary={`${APP_LABELS.dashboard.platformAdmin.summary.completionRate}: ${kpis.ccpDocCompletionRate}%`}
                  accentColor={
                    kpis.tenantsWithoutCcpDocs > 0 ? '#d32f2f' : '#757575'
                  }
                />
              </Grid>
            </Grid>
          )}

          {/* 섹션 3열 */}
          <Grid container spacing={2} alignItems="stretch">
            {/* 업체 코드 발급 현황 */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SectionCard
                title={
                  APP_LABELS.dashboard.platformAdmin.sections.tenantCodeIssuance
                }
                isError={hasTenantCodeIssuanceError}
                errorMessage="업체 코드 발급 현황 데이터를 불러오지 못했습니다."
                onRetry={onRetryTenantCodeIssuance}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {APP_LABELS.dashboard.platformAdmin.summary.totalIssued}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {tenantCodeIssuance.totalIssued}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {
                          APP_LABELS.dashboard.platformAdmin.summary
                            .issuedThisWeek
                        }
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {tenantCodeIssuance.issuedThisWeek}
                      </Typography>
                    </Box>
                  </Box>
                  {tenantCodeIssuance.recentIssues.length > 0 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {
                              APP_LABELS.dashboard.platformAdmin.table
                                .tenantCode
                            }
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {
                              APP_LABELS.dashboard.platformAdmin.table
                                .companyName
                            }
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {APP_LABELS.dashboard.platformAdmin.table.status}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {safeRecentIssues.slice(0, MAX_ROWS).map((item) => (
                          <TableRow key={item.tenantCode} hover>
                            <TableCell
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                              }}
                            >
                              {item.tenantCode}
                            </TableCell>
                            <TableCell>{item.companyName}</TableCell>
                            <TableCell>
                              <StatusChip status={item.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Stack>
              </SectionCard>
            </Grid>

            {/* 업체 목록 */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SectionCard
                title={APP_LABELS.dashboard.platformAdmin.sections.tenantList}
                isError={hasTenantListError}
                errorMessage="업체 목록 데이터를 불러오지 못했습니다."
                onRetry={onRetryTenantList}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {
                          APP_LABELS.dashboard.platformAdmin.summary
                            .totalTenants
                        }
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {safeTenantSummary.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {
                          APP_LABELS.dashboard.platformAdmin.summary
                            .activeTenants
                        }
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="success.main"
                      >
                        {safeTenantSummary.active}
                      </Typography>
                    </Box>
                  </Box>
                  {safeTenantItems.length > 0 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {
                              APP_LABELS.dashboard.platformAdmin.table
                                .companyName
                            }
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {APP_LABELS.dashboard.platformAdmin.table.adminName}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {APP_LABELS.dashboard.platformAdmin.table.status}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {safeTenantItems.slice(0, MAX_ROWS).map((item) => (
                          <TableRow key={item.tenantCode} hover>
                            <TableCell>{item.companyName}</TableCell>
                            <TableCell>{item.adminName}</TableCell>
                            <TableCell>
                              <StatusChip status={item.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Stack>
              </SectionCard>
            </Grid>

            {/* CCP 문서 현황 */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SectionCard
                title={APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments}
                isError={hasCcpDocumentsError}
                errorMessage="CCP 문서 현황 데이터를 불러오지 못했습니다."
                onRetry={onRetryCcpDocuments}
              >
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {
                        APP_LABELS.dashboard.platformAdmin.summary
                          .completionRate
                      }
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {safeCcpOverall.completionRate}%
                    </Typography>
                  </Box>
                  {safeCcpItems.length > 0 && (
                    <Stack spacing={1.5}>
                      {safeCcpItems.slice(0, MAX_ROWS).map((item) => (
                        <Box key={item.tenantCode}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2">
                              {item.companyName}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={
                                item.completionRate === 100
                                  ? 'success.main'
                                  : item.completionRate >= 50
                                    ? 'warning.main'
                                    : 'error.main'
                              }
                            >
                              {item.completionRate}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={item.completionRate}
                            color={
                              item.completionRate === 100
                                ? 'success'
                                : item.completionRate >= 50
                                  ? 'warning'
                                  : 'error'
                            }
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
