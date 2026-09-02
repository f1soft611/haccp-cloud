import { Typography } from '@mui/material';
import type { EventProps } from 'react-big-calendar';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';

export function WorkCalendarEventContent({
                                             event,
                                         }: EventProps<WorkCalendarEvent>) {
    return (
        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {event.title}
        </Typography>
    );
}