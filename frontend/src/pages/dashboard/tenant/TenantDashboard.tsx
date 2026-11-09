import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Stack, type Theme, Typography } from '@mui/material';
import { useSessionState } from '../../../shared/hooks/useSessionState';
import { WorkCalendarView } from '../../documents/work-calendar/components/WorkCalendarView';
import { useWorkCalendarData } from '../../documents/work-calendar/hooks/useWorkCalendarData';
import { useTenantDashboardData } from './hooks/useTenantDashboardData';
import { TenantSidebarSection } from './sections/TenantSidebarSection';
import { TenantTodoSection } from './sections/TenantTodoSection';
import { TenantStatusCardSection } from './sections/TenantStatusCardSection';
import {
    countCumulativeStatuses,
    EMPTY_TODO_FILTER,
    matchesTodoFilter,
    PENDING_APPROVAL_STATUS,
    type TenantDocScope,
    type TenantTodoFilter,
    type TenantViewMode,
} from './todoFilter';
import { APPROVAL_CARD_TOP_COLOR, DRAFT_CARD_TOP_COLOR } from './utils';

// 카드 섹션 제목: 동그라미 표시 + 문서 구분명
// 시안대로 동그라미 13px, 테두리 3px, 배경 흰색, 글씨 16px, 간격 7px, color 는 동그라미와 글씨에 적용
//         다크 모드는 페이지 배경에 묻히므로 시안 색 대신 text.primary 사용
function DocSectionTitle({ label, color }: { label: string; color: string }) {
    const resolveColor = (theme: Theme) =>
        theme.palette.mode === 'light' ? color : theme.palette.text.primary;

    return (
        <Stack direction="row" alignItems="center" sx={{ gap: '7px', mb: 1 }}>
            <Box
                sx={{
                    width: 13,
                    height: 13,
                    boxSizing: 'border-box',
                    bgcolor: 'background.paper',
                    border: '3px solid',
                    borderColor: resolveColor,
                    borderRadius: '50%',
                }}
            />
            <Typography
                variant="subtitle1"
                component="h2"
                fontWeight={700}
                sx={{ fontSize: 16, color: resolveColor }}
            >
                {label}
            </Typography>
        </Stack>
    );
}

// 기존 -> 종합현황: 상태 건수 + 검색필터 + 조건에 맞는 카드 또는 결재할문서 카드
// 변경 -> 나의 담당업무: 상태바 + 라디오로 고른 기안문서, 결재할문서 카드 또는 캘린더
export function TenantDashboard() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useSessionState<TenantViewMode>(
        'tenantDashboard.viewMode',
        'list',
    );
    const [docScope, setDocScope] = useSessionState<TenantDocScope>(
        'tenantDashboard.docScope',
        'all',
    );
    // 기존 -> draft, filter 를 나눠 조회 버튼으로 적용 (tenantDashboard.draft, tenantDashboard.filter)
    // 변경 -> 캘린더 범례 조건만 즉시 적용. 이전 세션의 업무명, 업무분류 조건이 남지 않도록 새 키 사용
    const [legendFilter, setLegendFilter] = useSessionState<TenantTodoFilter>(
        'tenantDashboard.legendFilter',
        EMPTY_TODO_FILTER,
    );

    const {
        todoSections,
        approvalSections,
        isTodoLoading,
        isTodoError,
        isApprovalLoading,
        isApprovalError,
    } = useTenantDashboardData();
    const calendar = useWorkCalendarData();

    // 업무카드별 서비스 시작일부터 누적 주기 수 합 (라디오, 보기 형식과 무관)
    const statusCounts = useMemo(
        () =>
            countCumulativeStatuses(
                todoSections.flatMap((section) => section.items),
                approvalSections.reduce((sum, section) => sum + section.items.length, 0),
            ),
        [todoSections, approvalSections],
    );

    const filteredEvents = useMemo(
        () =>
            calendar.events.filter((event) =>
                matchesTodoFilter(event.resource, legendFilter),
            ),
        [calendar.events, legendFilter],
    );

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 12 }}>
                <Stack spacing={2}>
                    <Paper
                        sx={{
                            px: 2,
                            py: 1,
                            bgcolor: '#EFF0F6',
                            boxShadow: 'none',
                            borderRadius: '7px',
                        }}
                    >
                        <TenantStatusCardSection
                            counts={statusCounts}
                            isLoading={isTodoLoading || isApprovalLoading}
                            onSelect={(status) => {
                                const query = new URLSearchParams({ status, startDate: '', endDate: '' });
                                if (status !== PENDING_APPROVAL_STATUS) {
                                    query.set('participantType', '담당자');
                                }
                                navigate(`/docs/haccp-doc?${query}`);
                            }}
                            docScope={docScope}
                            onDocScopeChange={setDocScope}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />
                    </Paper>

                    {viewMode === 'list' ? (
                        <Stack spacing={3}>
                            {docScope !== 'approval' ? (
                                <Box>
                                    <DocSectionTitle label="기안문서" color={DRAFT_CARD_TOP_COLOR} />
                                    <TenantTodoSection
                                        isLoading={isTodoLoading}
                                        isError={isTodoError}
                                        sections={todoSections}
                                        variant="draft"
                                    />
                                </Box>
                            ) : null}
                            {docScope !== 'draft' ? (
                                <Box>
                                    <DocSectionTitle label="결재할문서" color={APPROVAL_CARD_TOP_COLOR} />
                                    <TenantTodoSection
                                        isLoading={isApprovalLoading}
                                        isError={isApprovalError}
                                        sections={approvalSections}
                                        variant="approval"
                                    />
                                </Box>
                            ) : null}
                        </Stack>
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
                            {/* 기존 -> 범례 클릭 시 draft, filter 동시 세팅 / 변경 -> legendFilter 만 세팅, 적용된 값을 다시 클릭하면 해제('') */}
                            <WorkCalendarView
                                events={filteredEvents}
                                viewDate={calendar.viewDate}
                                onNavigate={calendar.setViewDate}
                                workdays={calendar.workdays}
                                legendFilter={{
                                    cycle: legendFilter.cycle,
                                    status: legendFilter.status,
                                    onSelect: (key, value) => {
                                        setLegendFilter({
                                            ...legendFilter,
                                            [key]: legendFilter[key] === value ? '' : value,
                                        });
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