import { ButtonBase, Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
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

const CARD_TOOLTIPS: Record<TodoStatusCardKey, string> = {
    미작성: '내가 작성해야 할 문서',
    결재대기중: '내 결재를 기다리는 문서',
    결재진행중: '내가 결재 요청했으나 아직 결재가 끝나지 않은 문서',
    승인: '내가 결재 요청해 최종 승인된 문서',
    반려: '내가 결재 요청했으나 반려된 문서',
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
                // 기존 -> 카드만 표시
                // 변경 -> 마우스를 올리면 상태 설명 툴팁 표시 (describeChild로 버튼 이름은 상태명 유지)
                return (
                    <Tooltip key={status} title={CARD_TOOLTIPS[status]} describeChild arrow>
                        <ButtonBase
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
                    </Tooltip>
                );
            })}
        </Stack>
    );
}