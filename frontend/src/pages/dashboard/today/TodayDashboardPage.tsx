import { useMemo } from 'react';
import { Paper, Stack } from '@mui/material';
import { useSessionState } from '../../../shared/hooks/useSessionState';
import { WorkCalendarView } from '../../documents/work-calendar/components/WorkCalendarView';
import { useWorkCalendarData } from '../../documents/work-calendar/hooks/useWorkCalendarData';
import { TodayBoard } from './TodayBoard';
import { TodayHeader, type TodayViewMode } from './TodayHeader';
import { useTodayDashboardData } from './useTodayDashboardData';
import { WorkStatusTable } from './WorkStatusTable';

export function TodayDashboardPage() {
    const [viewMode, setViewMode] = useSessionState<TodayViewMode>('todayDashboard.viewMode', 'status');
    const today = useMemo(() => new Date(), []);
    const data = useTodayDashboardData(today);
    const calendar = useWorkCalendarData();

    const { board, approvals } = data;
    const done = board.doneCount;
    const total = board.write.length + board.rejected.length + approvals.length + done;

    return (
        <Stack spacing={2}>
            <TodayHeader
                today={today}
                total={total}
                done={done}
                isLoading={data.isTodoLoading || data.isApprovalLoading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
            {viewMode === 'status' ? (
                <>
                    <TodayBoard
                        board={board}
                        approvals={approvals}
                        today={today}
                        isTodoLoading={data.isTodoLoading}
                        isTodoError={data.isTodoError}
                        isApprovalLoading={data.isApprovalLoading}
                        isHistoryLoading={data.isHistoryLoading}
                    />
                    <WorkStatusTable
                        rows={data.statusRows}
                        historyByWork={data.historyByWork}
                        today={today}
                        isLoading={data.isTodoLoading}
                        isError={data.isTodoError}
                        isHistoryLoading={data.isHistoryLoading}
                    />
                </>
            ) : (
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                    <WorkCalendarView
                        events={calendar.events}
                        viewDate={calendar.viewDate}
                        onNavigate={calendar.setViewDate}
                    />
                </Paper>
            )}
        </Stack>
    );
}