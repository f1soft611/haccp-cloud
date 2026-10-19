import { ButtonBase, Paper, Skeleton, Stack, Typography } from '@mui/material';
import {
    STATUS_CARD_KEYS,
    type TodoStatusCardKey,
    type TodoStatusCounts,
} from '../todoFilter';

const CARD_COLORS: Record<TodoStatusCardKey, string> = {
    미작성: 'text.primary',
    결재대기중: 'secondary.main',
    결재진행중: 'warning.main',
    승인: 'success.main',
    반려: 'error.main',
};

type TenantStatusCardSectionProps = {
    counts: TodoStatusCounts;
    selected: string;
    isLoading: boolean;
    onSelect: (status: TodoStatusCardKey) => void;
};

// 종합현황 리스트 상단: 상태별 건수(검색조건과 무관한 전체 기준), 클릭 시 상태필터 적용
export function TenantStatusCardSection(props: TenantStatusCardSectionProps) {
    const { counts, selected, isLoading, onSelect } = props;

    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {STATUS_CARD_KEYS.map((status) => {
                const isSelected = selected === status;
                return (
                    <ButtonBase
                        key={status}
                        aria-pressed={isSelected}
                        onClick={() => onSelect(status)}
                        sx={{ flex: 1, display: 'block', textAlign: 'left' }}
                    >
                        <Paper
                            sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                boxShadow: isSelected ? 2 : 0,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {status}
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={800}
                                sx={{ mt: 0.5, color: CARD_COLORS[status] }}
                            >
                                {isLoading ? <Skeleton width={40} /> : counts[status]}
                            </Typography>
                        </Paper>
                    </ButtonBase>
                );
            })}
        </Stack>
    );
}