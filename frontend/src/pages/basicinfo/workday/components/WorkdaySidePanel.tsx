import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import type { WorkdayItem } from '../../../../services/basicinfo/workday/workdayService';
import { WORKDAY_TYPE_LABELS, isOffDay, isRedDay, summarizeMonth } from '../workdayRules';

type WorkdaySidePanelProps = {
    year: number;
    // 1~12
    month: number;
    items: WorkdayItem[];
    onSelectDate: (workdayDate: string) => void;
};

export function WorkdaySidePanel({ year, month, items, onSelectDate }: WorkdaySidePanelProps) {
    const theme = useTheme();
    const summary = summarizeMonth(items, year, month);
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    const specialDays = items.filter(
        (item) =>
            item.workdayDate.startsWith(prefix) &&
            (item.dayType !== 'WORK') &&
            // 주말 정기휴무(이름 없음)는 목록에서 제외
            !(item.dayType === 'COMPANY_HOLIDAY' && !item.dayName),
    );

    const legend = [
        { label: '휴무', swatch: theme.palette.action.hover },
        { label: '공휴일/대체휴일', swatch: theme.palette.error.main },
        { label: '특근', swatch: theme.palette.primary.main },
    ];

    return (
        <Paper variant="outlined" sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, p: 2 }}>
            <Stack spacing={2}>
                <div>
                    <Typography variant="subtitle2">
                        {year}년 {month}월
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        영업일 {summary.workDays}일 / 휴무일 {summary.offDays}일
                    </Typography>
                </div>
                <Divider />
                <div>
                    <Typography variant="subtitle2">휴무/특근 목록</Typography>
                    {specialDays.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                            지정된 날이 없습니다.
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {specialDays.map((item) => (
                                <ListItemButton key={item.workdayDate} onClick={() => onSelectDate(item.workdayDate)}>
                                    <ListItemText
                                        primary={`${dayjs(item.workdayDate).format('M/D (dd)')} ${item.dayName}`.trim()}
                                        secondary={WORKDAY_TYPE_LABELS[item.dayType]}
                                        primaryTypographyProps={{
                                            color: isRedDay(item.dayType)
                                                ? 'error'
                                                : isOffDay(item.dayType)
                                                    ? 'text.primary'
                                                    : 'primary',
                                        }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </div>
                <Divider />
                <Stack spacing={0.5}>
                    {legend.map((entry) => (
                        <Stack key={entry.label} direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: entry.swatch }} />
                            <Typography variant="caption">{entry.label}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
}