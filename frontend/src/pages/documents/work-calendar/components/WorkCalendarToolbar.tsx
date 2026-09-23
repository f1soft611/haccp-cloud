import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Chip, IconButton, Stack, Typography } from '@mui/material';
import type { ToolbarProps } from 'react-big-calendar';
import { APP_LABELS } from '../../../../shared/constants/labels';
import { getWorkCycleSx } from '../../../dashboard/tenant/utils';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';

const [DAILY, MONTHLY, WEEKLY] = APP_LABELS.dashboard.cycles;
const CYCLE_LEGEND_ORDER = [DAILY, WEEKLY, MONTHLY];

export function WorkCalendarToolbar({
                                        date,
                                        onNavigate,
                                    }: ToolbarProps<WorkCalendarEvent>) {
    return (
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}
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
            <Stack direction="row" justifyContent="center" spacing={1}>
                {CYCLE_LEGEND_ORDER.map((cycleLabel) => (
                    <Chip
                        key={cycleLabel}
                        size="small"
                        label={cycleLabel}
                        sx={{ height: 20, fontWeight: 700, ...getWorkCycleSx(cycleLabel) }}
                    />
                ))}
            </Stack>
        </Stack>
    );
}