import { useMemo, useState } from 'react';
import { Grid, Paper, Stack } from '@mui/material';
import { WorkCalendarView } from '../../documents/work-calendar/components/WorkCalendarView';
import { useWorkCalendarData } from '../../documents/work-calendar/hooks/useWorkCalendarData';
import { useTenantDashboardData } from './hooks/useTenantDashboardData';
import { TenantFilterSection } from './sections/TenantFilterSection';
import { TenantSidebarSection } from './sections/TenantSidebarSection';
import { TenantTodoSection } from './sections/TenantTodoSection';
import {
  EMPTY_TODO_FILTER,
  matchesTodoFilter,
  type TenantViewMode,
} from './todoFilter';

// 기존 -> 상단 요약 배너(TenantSummarySection) + KPI 카드 4개(TenantKpiSection) + 할 일 그리드 + 우측 사이드바
// 변경 -> 좌측: 검색필터(리스트/캘린더 토글) + 할 일 리스트 또는 업무 캘린더, 우측: 공지사항
export function TenantDashboard() {
  const [viewMode, setViewMode] = useState<TenantViewMode>('list');
  // 입력 중인 조건(draft)과 조회 버튼으로 적용된 조건(filter)을 분리
  const [draft, setDraft] = useState(EMPTY_TODO_FILTER);
  const [filter, setFilter] = useState(EMPTY_TODO_FILTER);
  const { todoSections, isTodoLoading, isTodoError } =
    useTenantDashboardData();
  const calendar = useWorkCalendarData();

  const categoryOptions = useMemo(
    () => todoSections.map((section) => section.label),
    [todoSections],
  );

  const filteredSections = useMemo(
    () =>
      todoSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => matchesTodoFilter(item, filter)),
        }))
        .filter((section) => section.items.length > 0),
    [todoSections, filter],
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
      <Grid size={{ xs: 12, lg: 9 }}>
        <Stack spacing={2}>
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
      <Grid size={{ xs: 12, lg: 3 }}>
        <TenantSidebarSection />
      </Grid>
    </Grid>
  );
}
