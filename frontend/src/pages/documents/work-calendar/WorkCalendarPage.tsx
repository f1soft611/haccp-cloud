import { Alert, Paper, Stack } from '@mui/material';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { WorkCalendarView } from './components/WorkCalendarView';
import { useWorkCalendarData } from './hooks/useWorkCalendarData';

// 기존 -> Calendar 설정(localizer, 스타일, 클릭 라우팅)을 페이지에서 직접 구성
// 변경 -> WorkCalendarView 컴포넌트로 분리해 재사용
export function WorkCalendarPage() {
    const { viewDate, setViewDate, events, isError, error } =
        useWorkCalendarData();

    return (
        <Stack spacing={2} data-testid="work-calendar-page">
            <PageHeader
                groupLabel={APP_LABELS.menu.documentGroup}
                title="업무 캘린더"
                description="주기별 할일 업무를 달력에서 확인합니다."
            />

            {isError ? (
                <Alert severity="error">
                    {extractApiErrorMessage(error, '할일 목록을 불러오지 못했습니다.')}
                </Alert>
            ) : null}

            <Paper
                sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <WorkCalendarView
                    events={events}
                    viewDate={viewDate}
                    onNavigate={setViewDate}
                />
            </Paper>
        </Stack>
    );
}
