import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import type { ToolbarProps } from 'react-big-calendar';
import { useWorkCycleOptions } from '../../../../shared/hooks/useWorkCycleOptions';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { getWorkCycleSx, SELECTED_LEGEND_SX } from '../../../dashboard/tenant/utils';
import { WorkCalendarStatusLegend } from './WorkCalendarEvent';

const LEGEND_CYCLE_CODES = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME'];

// 범례 클릭으로 검색필터를 세팅하는 화면(대시보드)에서만 넘김
export type WorkCalendarLegendFilter = {
    cycle: string;
    status: string;
    onSelect: (key: 'cycle' | 'status', value: string) => void;
};

export function WorkCalendarToolbar({
                                        date,
                                        onNavigate,
                                        legendFilter,
                                    }: ToolbarProps<WorkCalendarEvent> & { legendFilter?: WorkCalendarLegendFilter }) {


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
                {LEGEND_CYCLE_CODES.map((code) => {
                    const cycleSx = getWorkCycleSx(code);
                    return (
                        <Chip
                            key={code}
                            size="small"
                            label={cycleOptions.find((option) => option.code === code)?.name ?? code}
                            onClick={legendFilter ? () => legendFilter.onSelect('cycle', code) : undefined}
                            sx={{
                                height: 20,
                                fontWeight: 700,
                                ...cycleSx,
                                '&:hover': { bgcolor: cycleSx.bgcolor },
                                ...(legendFilter?.cycle === code ? SELECTED_LEGEND_SX : {}),
                            }}
                        />
                    );
                })}
                <WorkCalendarStatusLegend
                    selected={legendFilter?.status}
                    onSelect={legendFilter ? (status) => legendFilter.onSelect('status', status) : undefined}
                />
            </Stack>
        </Stack>
    );
}