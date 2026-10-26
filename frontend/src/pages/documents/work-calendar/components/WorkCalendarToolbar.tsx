import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import type { ToolbarProps } from 'react-big-calendar';
import { useWorkCycleOptions } from '../../../../shared/hooks/useWorkCycleOptions';
import { getWorkCycleSx } from '../../../dashboard/tenant/utils';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { WorkCalendarStatusLegend } from './WorkCalendarEvent';

const LEGEND_CYCLE_CODES = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME'];

export function WorkCalendarToolbar({
                                        date,
                                        onNavigate,
                                    }: ToolbarProps<WorkCalendarEvent>) {

    const cycleOptions = useWorkCycleOptions();

    return (
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ position: 'relative' }}
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
                {/* 기존 -> 이전/다음 달 이동 버튼만 존재 */}
                {/* 변경 -> 오른쪽 상단에 오늘 날짜로 바로 이동하는 버튼 추가 */}
                <Button
                    size="small"
                    variant="outlined"
                    sx={{ position: 'absolute', right: 0, top: 0 }}
                    onClick={() => onNavigate('TODAY')}
                >
                    오늘
                </Button>
            </Stack>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} data-legend>
                {LEGEND_CYCLE_CODES.map((code) => (
                    <Chip
                        key={code}
                        size="small"
                        label={cycleOptions.find((option) => option.code === code)?.name ?? code}
                        sx={{ height: 20, fontWeight: 700, ...getWorkCycleSx(code) }}
                    />
                ))}
                <WorkCalendarStatusLegend />
            </Stack>
        </Stack>
    );
}