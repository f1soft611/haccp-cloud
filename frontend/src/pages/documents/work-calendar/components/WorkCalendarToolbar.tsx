import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, Typography } from '@mui/material';
import type { ToolbarProps } from 'react-big-calendar';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';

export function WorkCalendarToolbar({
                                        date,
                                        onNavigate,
                                    }: ToolbarProps<WorkCalendarEvent>) {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ mb: 1.5 }}
        >
            <IconButton
                aria-label="이전 달"
                size="small"
                onClick={() => onNavigate('PREV')}
            >
                <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={800}>
                {date.getFullYear()}년 {date.getMonth() + 1}월
            </Typography>
            <IconButton
                aria-label="다음 달"
                size="small"
                onClick={() => onNavigate('NEXT')}
            >
                <ChevronRightIcon />
            </IconButton>
        </Stack>
    );
}