import { useMemo } from 'react';
import { Box, Divider, Grid, Paper, Stack } from '@mui/material';
import { useSessionState } from '../../../shared/hooks/useSessionState';
import { WorkCalendarView } from '../../documents/work-calendar/components/WorkCalendarView';
import { useWorkCalendarData } from '../../documents/work-calendar/hooks/useWorkCalendarData';
import { useTenantDashboardData } from './hooks/useTenantDashboardData';
import { TenantFilterSection } from './sections/TenantFilterSection';
import { TenantSidebarSection } from './sections/TenantSidebarSection';
import { TenantTodoSection } from './sections/TenantTodoSection';
import { TenantStatusCardSection } from './sections/TenantStatusCardSection';
import {
    countCumulativeStatuses,
    EMPTY_TODO_FILTER,
    matchesTodoFilter,
    PENDING_APPROVAL_STATUS,
    type TenantTodoFilter,
    type TenantViewMode,
} from './todoFilter';

// 기존 -> 상단 요약 배너(TenantSummarySection) + KPI 카드 4개(TenantKpiSection) + 할 일 그리드 + 우측 사이드바
// 변경 -> 좌측: 검색필터(리스트/캘린더 토글) + 할 일 리스트 또는 업무 캘린더, 우측: 공지사항
export function TenantDashboard() {
  // 기존 -> useState : 문서 화면에서 뒤로가기로 돌아오면 보기 방식·검색조건이 초기화
  // 변경 -> useSessionState : sessionStorage에 저장해 돌아와도 유지
  const [viewMode, setViewMode] = useSessionState<TenantViewMode>(
    'tenantDashboard.viewMode',
    'list',
  );
  // 입력 중인 조건(draft)과 조회 버튼으로 적용된 조건(filter)을 분리
  const [draft, setDraft] = useSessionState<TenantTodoFilter>(
    'tenantDashboard.draft',
    EMPTY_TODO_FILTER,
  );
  const [filter, setFilter] = useSessionState<TenantTodoFilter>(
    'tenantDashboard.filter',
    EMPTY_TODO_FILTER,
  );

    const {
        todoSections,
        approvalSections,
        isTodoLoading,
        isTodoError,
        isApprovalLoading,
    } = useTenantDashboardData();
  const calendar = useWorkCalendarData();

  const categoryOptions = useMemo(
    () => todoSections.map((section) => section.label),
    [todoSections],
  );

    // 업무카드별 서비스 시작일부터 누적 주기 수 합 (검색조건과 무관)
    const statusCounts = useMemo(
        () =>
            countCumulativeStatuses(
                todoSections.flatMap((section) => section.items),
                approvalSections.reduce((sum, section) => sum + section.items.length, 0),
            ),
        [todoSections, approvalSections],
    );

    const isPendingApproval = filter.status === PENDING_APPROVAL_STATUS;

    // 결재할문서이면 내가 결재할 문서(approvalSections)에 검색조건 적용
    const filteredSections = useMemo(
        () =>
            (isPendingApproval ? approvalSections : todoSections)
            .map((section) => ({
                ...section,
                items: section.items.filter((item) => matchesTodoFilter(item, filter)),
            }))
            .filter((section) => section.items.length > 0),
        [todoSections, approvalSections, isPendingApproval, filter],
    );

  const filteredEvents = useMemo(
    () =>
      calendar.events.filter((event) =>
        matchesTodoFilter(event.resource, filter),
      ),
    [calendar.events, filter],
  );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 12 }}>
        <Stack spacing={2}>
            <Paper
                sx={{
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    borderRadius: '4px',
                }}
            >
                {viewMode === 'list' ? (
                    <>
                        <Box sx={{ px: 2, py: 1 }}>
                            <TenantStatusCardSection
                                counts={statusCounts}
                                selected={filter.status}
                                isLoading={isTodoLoading || isApprovalLoading}
                                onSelect={(status) => {
                                    setDraft({ ...draft, status });
                                    setFilter({ ...filter, status });
                                }}
                            />
                        </Box>
                        <Divider />
                    </>
                ) : null}
                <TenantFilterSection
                    value={draft}
                    categoryOptions={categoryOptions}
                    viewMode={viewMode}
                    onChange={setDraft}
                    onReset={() => {
                        setDraft(EMPTY_TODO_FILTER);
                        setFilter(EMPTY_TODO_FILTER);
                    }}
                    onSearch={() => setFilter(draft)}
                    onViewModeChange={setViewMode}
                />
            </Paper>

          {viewMode === 'list' ? (
            <TenantTodoSection
              isLoading={isTodoLoading}
              isError={isTodoError}
              sections={filteredSections}
              pendingApproval={isPendingApproval}
            />
          ) : (
            <Paper
              data-testid="tenant-dashboard-calendar"
              sx={{
                p: 2,
                border: '1px solid',
                  borderRadius: '4px',
                borderColor: 'divider',
              }}
            >
                {/* 기존 -> 범례는 표시만 */}
                {/* 변경 -> 범례 클릭 시 상태 카드처럼 draft, filter 동시 세팅해 즉시 조회, 적용된 값을 다시 클릭하면 해제('') */}
                <WorkCalendarView
                    events={filteredEvents}
                    viewDate={calendar.viewDate}
                    onNavigate={calendar.setViewDate}
                    legendFilter={{
                        cycle: filter.cycle,
                        status: filter.status,
                        onSelect: (key, value) => {
                            const next = filter[key] === value ? '' : value;
                            setDraft({ ...draft, [key]: next });
                            setFilter({ ...filter, [key]: next });
                        },
                    }}
                />
            </Paper>
          )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'none' }}>
        <TenantSidebarSection />
      </Grid>
    </Grid>
  );
}
