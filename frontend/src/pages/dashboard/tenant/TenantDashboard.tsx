import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Stack, Typography, useTheme } from '@mui/material';
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
import { getDashboardCssVars } from './utils';
import styles from './tenantDashboard.module.css';

function DocSectionTitle({ label, toneClassName }: { label: string; toneClassName: string }) {
    return (
        <Stack direction="row" alignItems="center" className={`${styles.docTitleRow} ${toneClassName}`}>
            <Box className={styles.docTitleDot} />
            <Typography variant="subtitle1" component="h2" className={styles.docTitleText}>
                {label}
            </Typography>
        </Stack>
    );
}

// 기존 -> 종합현황: 상태 건수 + 검색필터 + 조건에 맞는 카드 또는 결재할문서 카드
// 변경 -> 나의 담당업무: 상태바 + 라디오로 고른 기안문서, 결재할문서 카드 또는 캘린더
export function TenantDashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
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
        <Grid
            container
            spacing={2}
            className={styles.scope}
            data-mode={theme.palette.mode}
            style={getDashboardCssVars(theme)}
        >
            <Grid size={{ xs: 12, lg: 12 }}>
                <Stack spacing={2}>
                    <Paper className={styles.statusPanel}>
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
                                    <DocSectionTitle label="기안문서" toneClassName={styles.docTitleDraft} />
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
                                    <DocSectionTitle label="결재할문서" toneClassName={styles.docTitleApproval} />
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
                        <Paper data-testid="tenant-dashboard-calendar" className={styles.calendarPanel}>
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
            {/* 사이드바 */}
            <Grid size={{ xs: 12, lg: 3 }} className={styles.hiddenSidebar}>
                <TenantSidebarSection />
            </Grid>
        </Grid>
    );
}