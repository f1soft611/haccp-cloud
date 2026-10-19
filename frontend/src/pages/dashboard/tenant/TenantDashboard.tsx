import { useMemo } from 'react';
import { Grid, Paper, Stack } from '@mui/material';
import { useSessionState } from '../../../shared/hooks/useSessionState';
import { WorkCalendarView } from '../../documents/work-calendar/components/WorkCalendarView';
import { useWorkCalendarData } from '../../documents/work-calendar/hooks/useWorkCalendarData';
import { useTenantDashboardData } from './hooks/useTenantDashboardData';
import { TenantFilterSection } from './sections/TenantFilterSection';
import { TenantSidebarSection } from './sections/TenantSidebarSection';
import { TenantTodoSection } from './sections/TenantTodoSection';
import { TenantStatusCardSection } from './sections/TenantStatusCardSection';
import {
    countTodoStatuses,
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

    // 검색조건과 무관한 전체 기준 건수
    const statusCounts = useMemo(
        () =>
            countTodoStatuses(
                todoSections.flatMap((section) => section.items),
                approvalSections.reduce((sum, section) => sum + section.items.length, 0),
            ),
        [todoSections, approvalSections],
    );

    const isPendingApproval = filter.status === PENDING_APPROVAL_STATUS;

    // 기존 -> todoSections에 검색조건 적용
    // 변경 -> 결재대기중이면 내가 결재할 문서(approvalSections)에 검색조건 적용
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
            {viewMode === 'list' ? (
                <TenantStatusCardSection
                    counts={statusCounts}
                    selected={filter.status}
                    isLoading={isTodoLoading || isApprovalLoading}
                    onSelect={(status) => {
                        setDraft({ ...draft, status });
                        setFilter({ ...filter, status });
                    }}
                />
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
                // 기존 -> 둥근 모서리(borderRadius 3)
                // 변경 -> 검색필터와 같은 테마 기본 모서리
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <WorkCalendarView
                events={filteredEvents}
                viewDate={calendar.viewDate}
                onNavigate={calendar.setViewDate}
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
