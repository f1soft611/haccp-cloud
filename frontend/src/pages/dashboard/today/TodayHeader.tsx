import {
    Box,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';

export type TodayViewMode = 'status' | 'calendar';

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

type TodayHeaderProps = {
    today: Date;
    total: number;
    done: number;
    isLoading: boolean;
    viewMode: TodayViewMode;
    onViewModeChange: (mode: TodayViewMode) => void;
};

export function TodayHeader(props: TodayHeaderProps) {
    const { today, total, done, isLoading, viewMode, onViewModeChange } = props;
    const percent = total === 0 ? 100 : Math.round((done / total) * 100);

    return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        {today.getMonth() + 1}월 {today.getDate()}일 {WEEKDAYS[today.getDay()]}
                    </Typography>
                    {isLoading ? (
                        <Skeleton width={200} />
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            오늘 처리할 일 {total}건 중 {done}건 완료
                        </Typography>
                    )}
                    <LinearProgress
                        variant={isLoading ? 'indeterminate' : 'determinate'}
                        value={percent}
                        sx={{ mt: 1, height: 8, borderRadius: 4, maxWidth: 360 }}
                    />
                </Box>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={viewMode}
                    onChange={(_, mode: TodayViewMode | null) => {
                        if (mode) {
                            onViewModeChange(mode);
                        }
                    }}
                >
                    <ToggleButton value="status">현황</ToggleButton>
                    <ToggleButton value="calendar">캘린더</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
        </Paper>
    );
}