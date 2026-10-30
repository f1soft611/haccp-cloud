import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { ButtonBase, Divider, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
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

const CARD_ICONS: Record<TodoStatusCardKey, SvgIconComponent> = {
    미작성: NoteAddOutlinedIcon,
    결재대기중: PendingActionsOutlinedIcon,
    결재진행중: HourglassTopOutlinedIcon,
    승인: TaskOutlinedIcon,
    반려: AssignmentReturnOutlinedIcon,
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
// 기존 -> 상태별 개별 Paper 카드 5개
// 변경 -> 바깥 패널(TenantDashboard) 안의 가로 한 줄, 칸 사이 세로 구분선, 아이콘 + 라벨 + 숫자 + 건
export function TenantStatusCardSection(props: TenantStatusCardSectionProps) {
    const { counts, selected, isLoading, onSelect } = props;

    return (
        <Stack
            direction="row"
            flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
            divider={
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ my: 1.5, display: { xs: 'none', sm: 'block' } }}
                />
            }
        >
            {STATUS_CARD_KEYS.map((status) => {
                const isSelected = selected === status;
                const Icon = CARD_ICONS[status];
                // 마우스를 올리면 상태 설명 툴팁 표시 (describeChild로 버튼 이름은 상태명 유지)
                return (
                    <Tooltip key={status} title={CARD_TOOLTIPS[status]} describeChild arrow>
                        <ButtonBase
                            aria-pressed={isSelected}
                            onClick={() => onSelect(status)}
                            sx={{
                                flex: { xs: '1 1 50%', sm: 1 },
                                gap: 1,
                                py: 1.5,
                                px: 2,
                                borderRadius: 1,
                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                '&:hover': {
                                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                                },
                            }}
                        >
                            <Icon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                                {status}
                            </Typography>
                            <Typography
                                variant="h5"
                                component="span"
                                fontWeight={800}
                                sx={{ color: CARD_COLORS[status] }}
                            >
                                {isLoading ? <Skeleton width={32} /> : counts[status]}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                건
                            </Typography>
                        </ButtonBase>
                    </Tooltip>
                );
            })}
        </Stack>
    );
}