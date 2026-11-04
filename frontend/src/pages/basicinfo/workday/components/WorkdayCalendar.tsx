import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useMemo, type CSSProperties } from 'react';
import { Calendar, dayjsLocalizer, type DateHeaderProps } from 'react-big-calendar';
import type { WeekItem, WorkdayItem } from '../../../../services/basicinfo/workday/workdayService';
import { dayColor, findWeek, isOffDay, isRedDay } from '../workdayRules';

dayjs.locale('ko');
const localizer = dayjsLocalizer(dayjs);

type WorkdayEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay: true;
    item: WorkdayItem;
};

type WorkdayCalendarProps = {
    items: WorkdayItem[];
    changedDates: Set<string>;
    weeks: WeekItem[];
    viewDate: Date;
    onNavigate: (date: Date) => void;
    onSelectDate: (workdayDate: string) => void;
};

export function WorkdayCalendar(props: WorkdayCalendarProps) {
    const { items, changedDates, weeks, viewDate, onNavigate, onSelectDate } = props;
    const theme = useTheme();
    const itemByDate = useMemo(
        () => new Map(items.map((item) => [item.workdayDate, item])),
        [items],
    );

    // 휴일명이 있거나 특근일인 날만 이벤트로 표시
    const events = useMemo<WorkdayEvent[]>(
        () =>
            items
            .filter((item) => item.dayName || item.dayType === 'SPECIAL_WORK')
            .map((item) => {
                const start = dayjs(item.workdayDate).toDate();
                const title =
                    item.dayType === 'SPECIAL_WORK' ? `${item.dayName} 특근`.trim() : item.dayName;
                return { title, start, end: start, allDay: true, item };
            }),
        [items],
    );

    const components = useMemo(
        () => ({
            month: {
                dateHeader: ({ date, label }: DateHeaderProps) => {
                    const workdayDate = dayjs(date).format('YYYY-MM-DD');
                    const item = itemByDate.get(workdayDate);
                    // 데이터 없는 칸(생성 안 된 연도, 앞뒤 달)은 요일만 보고 색을 정함
                    const color = dayColor(workdayDate, item?.dayType ?? 'WORK');
                    const week = dayjs(date).day() === 1 ? findWeek(weeks, workdayDate) : undefined;
                    return (
                        <span>
                            {week ? (
                                <span style={{ fontSize: 11, color: theme.palette.text.secondary, marginRight: 4 }}>
                                    W{week.week}
                                </span>
                            ) : null}
                            <span
                                style={{
                                    color:
                                        color === 'red'
                                            ? theme.palette.error.main
                                            : color === 'blue'
                                                ? theme.palette.primary.main
                                                : undefined,
                                }}
                            >
                                {label}
                            </span>
                        </span>
                    );
                },
            },
        }),
        [itemByDate, weeks, theme],
    );

    return (
        <Calendar<WorkdayEvent>
            localizer={localizer}
            date={viewDate}
            onNavigate={onNavigate}
            defaultView="month"
            views={['month']}
            events={events}
            selectable
            popup
            style={{ height: 640 }}
            components={components}
            messages={{
                today: '오늘',
                previous: '이전',
                next: '다음',
                showMore: (count) => `+${count}건 더보기`,
            }}
            dayPropGetter={(date) => {
                const workdayDate = dayjs(date).format('YYYY-MM-DD');
                const item = itemByDate.get(workdayDate);
                const style: CSSProperties = { cursor: 'pointer' };
                if (item && isOffDay(item.dayType)) {
                    style.backgroundColor = theme.palette.action.hover;
                }
                if (changedDates.has(workdayDate)) {
                    style.boxShadow = `inset 0 0 0 2px ${theme.palette.primary.main}`;
                }
                return { style };
            }}
            eventPropGetter={(event) => {
                const { dayType } = event.item;
                const color = isRedDay(dayType)
                    ? theme.palette.error.main
                    : dayType === 'SPECIAL_WORK'
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary;
                return {
                    style: { backgroundColor: 'transparent', color, border: 'none', fontSize: 12 },
                };
            }}
            onSelectSlot={({ start }) => onSelectDate(dayjs(start).format('YYYY-MM-DD'))}
            onSelectEvent={(event) => onSelectDate(event.item.workdayDate)}
        />
    );
}