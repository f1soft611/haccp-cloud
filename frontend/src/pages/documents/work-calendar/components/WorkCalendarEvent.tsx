import { Box, Typography } from '@mui/material';
import type { EventProps } from 'react-big-calendar';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';

type StatusBadge = { label: string; color: 'info' | 'warning' | 'error' };

// 공통 상태 라벨 → 캘린더 배지 (승인·미작성은 배지 없음, 결재진행중은 칸이 좁아 '결재중')
const STATUS_BADGES: Record<string, StatusBadge> = {
    임시저장: { label: '임시저장', color: 'info' },
    결재진행중: { label: '결재중', color: 'warning' },
    반려: { label: '반려', color: 'error' },
};

export const STATUS_BADGE_LEGEND = Object.values(STATUS_BADGES);

export function getStatusBadge(approvalStatusType: string | undefined): StatusBadge | null {
    const { label } = resolveApprovalStatusView({ approvalStatusType });
    return STATUS_BADGES[label] ?? null;
}

export function WorkCalendarStatusBadge({ label, color }: StatusBadge) {
    return (
        <Box
            component="span"
            data-status-badge
            sx={{
                display: 'inline-block',
                mr: 0.5,
                px: 0.5,
                borderRadius: 0.5,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1.6,
                bgcolor: `${color}.main`,
                color: `${color}.contrastText`,
            }}
        >
            {label}
        </Box>
    );
}

// 기존 -> 제목만 표시
// 변경 -> 임시저장·결재중·반려면 제목 앞에 상태 배지 (제목은 별도 span으로 검색 가능하게 유지)
export function WorkCalendarEventContent({
                                             event,
                                         }: EventProps<WorkCalendarEvent>) {
    const badge = getStatusBadge(event.resource.approvalStatusType);
    return (
        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {badge && <WorkCalendarStatusBadge {...badge} />}
            <span>{event.title}</span>
        </Typography>
    );
}