import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useNavigate } from 'react-router-dom';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import { getWorkCycleLabel, getWorkCycleSx } from '../../../dashboard/tenant/utils';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { WorkCalendarEventContent } from './WorkCalendarEvent';
import { WorkCalendarToolbar } from './WorkCalendarToolbar';

dayjs.locale('ko');
const localizer = dayjsLocalizer(dayjs);

type WorkCalendarViewProps = {
    events: WorkCalendarEvent[];
    viewDate: Date;
    onNavigate: (date: Date) => void;
    height?: number;
};

// 기존 -> WorkCalendarPage 안에 Calendar 설정이 직접 들어 있음
// 변경 -> 대시보드에서도 재사용할 수 있도록 Calendar 본체만 컴포넌트로 분리
export function WorkCalendarView(props: WorkCalendarViewProps) {
    const { events, viewDate, onNavigate, height = 720 } = props;
    const navigate = useNavigate();

    return (
        <Calendar<WorkCalendarEvent>
            localizer={localizer}
            date={viewDate}
            onNavigate={onNavigate}
            defaultView="month"
            views={['month']}
            events={events}
            popup
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={(event) => {
                const cycleLabel = getWorkCycleLabel(event.resource);
                const sx = getWorkCycleSx(cycleLabel);
                return {
                    style: {
                        backgroundColor: sx.bgcolor,
                        color: sx.color,
                        border: sx.border,
                    },
                };
            }}
            style={{ height }}
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
    );
}
