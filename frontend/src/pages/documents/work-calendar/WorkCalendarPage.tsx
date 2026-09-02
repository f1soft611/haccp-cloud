import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Alert, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { resolveDraftRoute } from '../../../shared/utils/workDraftRoute';
import { WorkCalendarToolbar } from './components/WorkCalendarToolbar';
import { WorkCalendarEventContent } from './components/WorkCalendarEvent';
import {
    useWorkCalendarData,
    type WorkCalendarEvent,
} from './hooks/useWorkCalendarData';

dayjs.locale('ko');
const localizer = dayjsLocalizer(dayjs);

export function WorkCalendarPage() {
    const navigate = useNavigate();
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
                <Calendar<WorkCalendarEvent>
                    localizer={localizer}
                    date={viewDate}
                    onNavigate={setViewDate}
                    defaultView="month"
                    views={['month']}
                    events={events}
                    popup
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 720 }}
                    components={{
                        toolbar: WorkCalendarToolbar,
                        event: WorkCalendarEventContent,
                    }}
                    messages={{
                        noEventsInRange: '등록된 업무가 없습니다.',
                        showMore: (count) => `+${count}건 더보기`,
                    }}
                    onSelectEvent={(event) => {
                        const path = resolveDraftRoute(event.resource);
                        if (!path) {
                            return;
                        }
                        navigate(path);
                    }}
                />
            </Paper>
        </Stack>
    );
}