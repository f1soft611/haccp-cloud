import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dayjsLocalizer, type ToolbarProps } from 'react-big-calendar';
import { resolveDraftRoute, resolveExpirationDraftRoute } from '../../../../shared/utils/workDraftRoute';
import { getWorkCycleSx } from '../../../dashboard/tenant/utils';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { WorkCalendarEventContent } from './WorkCalendarEvent';
import { WorkCalendarToolbar, type WorkCalendarLegendFilter } from './WorkCalendarToolbar';

dayjs.locale('ko');
const localizer = dayjsLocalizer(dayjs);

type WorkCalendarViewProps = {
    events: WorkCalendarEvent[];
    viewDate: Date;
    onNavigate: (date: Date) => void;
    height?: number;
    legendFilter?: WorkCalendarLegendFilter;
};

// 기존 -> WorkCalendarPage 안에 Calendar 설정이 직접 들어 있음
// 변경 -> 대시보드에서도 재사용할 수 있도록 Calendar 본체만 컴포넌트로 분리
export function WorkCalendarView(props: WorkCalendarViewProps) {
    const { events, viewDate, onNavigate, height = 720, legendFilter } = props;
    const navigate = useNavigate();
    // ponytail: legendFilter 가 바뀌면 툴바가 다시 마운트됨 (상태 없는 컴포넌트라 문제없음, 배지 키보드 포커스만 풀림)
    const components = useMemo(
        () => ({
            toolbar: (toolbarProps: ToolbarProps<WorkCalendarEvent>) => (
                <WorkCalendarToolbar {...toolbarProps} legendFilter={legendFilter} />
            ),
            event: WorkCalendarEventContent,
        }),
        [legendFilter],
    );

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
                const sx = getWorkCycleSx(event.resource.cycle);
                return {
                    style: {
                        backgroundColor: sx.bgcolor,
                        color: sx.color,
                        border: sx.border,
                        opacity: event.isFuture ? 0.45 : 1,
                        cursor: event.isFuture ? 'default' : 'pointer',
                    },
                };
            }}
            style={{ height }}
            components={components}
            messages={{
                noEventsInRange: '등록된 업무가 없습니다.',
                showMore: (count) => `+${count}건 더보기`,
            }}
            onSelectEvent={(event) => {
                if (event.expiration) {
                    navigate(resolveExpirationDraftRoute(event.expiration));
                    return;
                }
                if (event.isFuture) {
                    return;
                }
                const path = resolveDraftRoute(event.resource, event.cycleDate);
                if (!path) {
                    return;
                }
                navigate(path);
            }}
        />
    );
}
