import {
  Alert,
  Button,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  listDocuments,
  type DocumentTemplate,
} from '../services/documentsService';
import { getDashboardConfigByRole } from './dashboard/roleDashboardConfig';
import { PlatformAdminDashboard } from './dashboard/platformAdmin/PlatformAdminDashboard';
import { useAuthStore } from '../shared/store/authStore';
import { getDashboardMetrics } from '../services/dashboardService';
import { APP_LABELS, getRoleLabel } from '../shared/ui/labels';

type PortalSectionKey = 'selected' | 'ha' | 'others';

const PORTAL_SECTIONS: Array<{
  key: PortalSectionKey;
  headerBg: string;
  panelBg: string;
}> = [
  {
    key: 'selected',
    headerBg: 'linear-gradient(120deg, #0f4f90, #1e69b0)',
    panelBg: '#f3f8ff',
  },
  {
    key: 'ha',
    headerBg: 'linear-gradient(120deg, #0d3f78, #16589b)',
    panelBg: '#f2f7ff',
  },
  {
    key: 'others',
    headerBg: 'linear-gradient(120deg, #2d6aac, #3f8bd4)',
    panelBg: '#f5f9ff',
  },
];

function classifyDocumentSection(item: DocumentTemplate): PortalSectionKey {
  const text = `${item.title} ${item.category}`.toLowerCase();

  if (text.includes('ccp') || text.includes('ha')) {
    return 'ha';
  }

  if (
    text.includes('haccp') ||
    text.includes('점검') ||
    text.includes('위생') ||
    text.includes('품질') ||
    text.includes('sop')
  ) {
    return 'selected';
  }

  return 'others';
}

function getDocumentCycle(item: DocumentTemplate): string {
  const text = `${item.title} ${item.category}`.toLowerCase();

  if (text.includes('ccp') || text.includes('온도')) {
    return APP_LABELS.dashboard.cycles[0];
  }

  if (text.includes('prp') || text.includes('세척')) {
    return APP_LABELS.dashboard.cycles[2];
  }

  return APP_LABELS.dashboard.cycles[1];
}

const NOTICE_ITEMS = [
  'HACCP CCP 온도기록 누락 점검 주간 운영(6.19~6.26)',
  'HACCP 문서 템플릿 버전관리 정책 업데이트 안내',
  '현장 점검 체크리스트 모바일 입력 기능 점검 안내',
  '식품안전 사고 대응 보고서 제출 절차 변경 공지',
];

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

export function DashboardPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const userId = useAuthStore((state) => state.userId || '-');
  const role = useAuthStore((state) => state.role);
  const dashboardConfig = getDashboardConfigByRole(role);
  const isPlatformAdminView = dashboardConfig.view === 'platformAdmin';

  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useQuery({
    queryKey: ['dashboard', tenantCode],
    queryFn: () => getDashboardMetrics(tenantCode),
    enabled: !isPlatformAdminView,
  });
  const {
    data: documents = [],
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
  } = useQuery({
    queryKey: ['documents', tenantCode],
    queryFn: () => listDocuments(tenantCode),
    enabled: !isPlatformAdminView,
  });

  const totalDocuments = metrics?.totalDocuments ?? 0;
  const draftDocuments = metrics?.draftTemplates ?? 0;
  const updatedToday = metrics?.updatedToday ?? 0;
  const activeDocuments = Math.max(totalDocuments - draftDocuments, 0);
  const ccpCompletion =
    totalDocuments === 0
      ? 0
      : Math.round((activeDocuments / totalDocuments) * 100);
  const uncheckedCount = Math.max(totalDocuments - updatedToday, 0);
  const todayActionCount = uncheckedCount + draftDocuments;
  const isAdminRole = role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN';
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';
  const [portalSearch, setPortalSearch] = useState<
    Record<PortalSectionKey, string>
  >({
    selected: '',
    ha: '',
    others: '',
  });

  const portalItems = useMemo(() => {
    const grouped: Record<PortalSectionKey, DocumentTemplate[]> = {
      selected: [],
      ha: [],
      others: [],
    };

    documents.forEach((item) => {
      const key = classifyDocumentSection(item);
      grouped[key].push(item);
    });

    return grouped;
  }, [documents]);

  const filteredPortalItems = useMemo(() => {
    const result: Record<PortalSectionKey, DocumentTemplate[]> = {
      selected: [],
      ha: [],
      others: [],
    };

    PORTAL_SECTIONS.forEach(({ key }) => {
      const query = portalSearch[key].trim().toLowerCase();
      result[key] = portalItems[key].filter((item) => {
        if (!query) {
          return true;
        }

        const searchTarget =
          `${item.title} ${item.category} ${item.updatedBy}`.toLowerCase();
        return searchTarget.includes(query);
      });
    });

    return result;
  }, [portalItems, portalSearch]);

  if (isPlatformAdminView) {
    return <PlatformAdminDashboard />;
  }

  const isLoading = isMetricsLoading || isDocumentsLoading;
  const isError = isMetricsError || isDocumentsError;

  return (
    <Stack spacing={2.25}>
      {isError ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small">
              재시도
            </Button>
          }
        >
          데이터를 불러오지 못했습니다. 네트워크 상태를 확인하세요.
        </Alert>
      ) : null}

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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                {APP_LABELS.dashboard.blocks.loginPanel}
              </Typography>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={0.75}>
                  <Chip
                    size="small"
                    color="primary"
                    label={`업체 ${tenantCode}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`사용자 ${userId}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={getRoleLabel(role)}
                  />
                </Stack>
              </Stack>
              <Divider />
              {isAdminRole ? (
                <Paper
                  data-testid="dashboard-admin-hub"
                  variant="outlined"
                  sx={{ p: 1.25, borderRadius: 2 }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {APP_LABELS.dashboard.hubs.admin}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                      <Button component={NavLink} to="/users" size="small">
                        {APP_LABELS.dashboard.hubs.users}
                      </Button>
                      <Button
                        component={NavLink}
                        to="/departments"
                        size="small"
                      >
                        {APP_LABELS.dashboard.hubs.departments}
                      </Button>
                      {isPlatformAdmin ? (
                        <Button
                          component={NavLink}
                          to="/onboarding"
                          size="small"
                        >
                          {APP_LABELS.dashboard.hubs.onboarding}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <Paper
                  data-testid="dashboard-user-hub"
                  variant="outlined"
                  sx={{ p: 1.25, borderRadius: 2 }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {APP_LABELS.dashboard.hubs.user}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                      <Button component={NavLink} to="/documents" size="small">
                        {APP_LABELS.dashboard.hubs.documents}
                      </Button>
                      <Button
                        component={NavLink}
                        to="/document-history"
                        size="small"
                      >
                        {APP_LABELS.dashboard.hubs.history}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              <Typography variant="subtitle1" fontWeight={700}>
                {APP_LABELS.dashboard.blocks.todos}
              </Typography>
              <Grid container spacing={1}>
                {APP_LABELS.dashboard.todoItems.map((todo) => (
                  <Grid key={todo} size={{ xs: 12, sm: 6 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: 'rgba(31,79,143,0.03)',
                        fontWeight: 600,
                      }}
                    >
                      {todo}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'rgba(31,79,143,0.2)',
              bgcolor: '#f7fbff',
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
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                더 보기 -&gt;
              </Typography>
            </Stack>
            <Stack spacing={0.8} sx={{ mt: 1.1 }}>
              {NOTICE_ITEMS.map((notice) => (
                <Typography key={notice} variant="body1" fontWeight={700}>
                  {notice} 📌
                </Typography>
              ))}
            </Stack>
            <Box
              sx={{
                mt: 1.4,
                pt: 1.2,
                borderTop: '1px solid rgba(31,79,143,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 0 }}
                noWrap
              >
                [품질관리팀] 6월 정기 내부심사 결과 보고서 등록 마감: 06-28
              </Typography>
              <Chip
                size="small"
                label="N"
                color="primary"
                sx={{ fontWeight: 800, minWidth: 24, height: 22 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Stack spacing={1.1}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          {APP_LABELS.dashboard.sectionHeading}
        </Typography>
        <Grid container spacing={1.5}>
          {PORTAL_SECTIONS.map((section) => {
            const items = filteredPortalItems[section.key];
            const totalCount = portalItems[section.key].length;

            return (
              <Grid key={section.key} size={{ xs: 12, lg: 4 }}>
                <Paper
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid #d7e4f4',
                    overflow: 'hidden',
                    bgcolor: section.panelBg,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 1.5,
                      py: 1,
                      color: '#fff',
                      background: section.headerBg,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800}>
                      {APP_LABELS.dashboard.sections[section.key]}
                    </Typography>
                    <Chip
                      size="small"
                      label={String(totalCount)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        fontWeight: 800,
                        height: 24,
                      }}
                    />
                  </Stack>

                  <Box sx={{ p: 1.25, pb: 1 }}>
                    <TextField
                      value={portalSearch[section.key]}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setPortalSearch((prev) => ({
                          ...prev,
                          [section.key]: nextValue,
                        }));
                      }}
                      placeholder={APP_LABELS.dashboard.searchPlaceholder}
                      size="small"
                      fullWidth
                      inputProps={{
                        'aria-label': `${APP_LABELS.dashboard.sections[section.key]} 검색`,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#fff',
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ px: 1.25, pb: 1.1 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '0.7fr 2.2fr 0.9fr 1fr',
                        px: 0.75,
                        py: 0.7,
                        borderBottom: '1px solid #cbd9ea',
                        color: 'primary.dark',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      <Box>{APP_LABELS.dashboard.columns.no}</Box>
                      <Box>{APP_LABELS.dashboard.columns.name}</Box>
                      <Box>{APP_LABELS.dashboard.columns.cycle}</Box>
                      <Box>{APP_LABELS.dashboard.columns.owner}</Box>
                    </Box>

                    <Stack
                      spacing={0.25}
                      sx={{ maxHeight: 270, overflowY: 'auto', pt: 0.25 }}
                    >
                      {items.length === 0 ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ px: 0.75, py: 1.25 }}
                        >
                          표시할 문서가 없습니다.
                        </Typography>
                      ) : (
                        items.map((item, index) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '0.7fr 2.2fr 0.9fr 1fr',
                              alignItems: 'center',
                              px: 0.75,
                              py: 0.72,
                              borderRadius: 1,
                              bgcolor:
                                index % 2 === 0
                                  ? 'rgba(255,255,255,0.72)'
                                  : 'transparent',
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="primary.dark"
                            >
                              {String(index + 1).padStart(2, '0')}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              title={item.title}
                              sx={{ pr: 0.5 }}
                            >
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getDocumentCycle(item)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.updatedBy}
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Paper
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight={700}>
            {APP_LABELS.dashboard.blocks.recentHistory}
          </Typography>
          {isLoading ? <CircularProgress size={18} /> : null}
        </Stack>
        <Stack spacing={1} sx={{ mt: 1.25 }}>
          {documents.length === 0 ? (
            <Alert severity="info">
              아직 변경 이력이 없습니다. 문서를 먼저 등록하세요.
            </Alert>
          ) : (
            documents.slice(0, 5).map((item) => (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{ px: 1.5, py: 1.25, bgcolor: 'rgba(31,79,143,0.03)' }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={0.75}
                >
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.updatedBy} · v{item.version}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {item.status === 'ACTIVE' ? '사용중' : '임시저장'} ·{' '}
                  {item.category}
                </Typography>
              </Paper>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
