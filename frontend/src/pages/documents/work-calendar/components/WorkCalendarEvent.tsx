import type { KeyboardEvent } from 'react';
import { Box, Typography } from '@mui/material';
import type { EventProps } from 'react-big-calendar';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { SELECTED_LEGEND_SX } from '../../../dashboard/tenant/utils';

type StatusBadge = {
    label: string;
    short: string;
    color: 'info' | 'warning' | 'error' | 'success';
    outlined?: boolean;
};

// 공통 상태 라벨 → 캘린더 배지 (미작성은 배지 없음, 결재진행중은 칸이 좁아 '결재중')
// 기존 -> label만 (범례·이벤트 공용)
// 변경 -> 이벤트 칸용 한 글자 short 추가 (범례는 label 그대로)
const STATUS_BADGES: Record<string, StatusBadge> = {
    임시저장: { label: '임시저장', short: '임', color: 'info' },
    결재진행중: { label: '결재중', short: '중', color: 'warning' },
    반려: { label: '반려', short: '반', color: 'error' },
    승인: { label: '승인', short: '승', color: 'success' },
};
const EXPIRATION_BADGE: StatusBadge = { label: '만료', short: '만', color: 'error', outlined: true };

type WorkCalendarStatusLegendProps = {
    selected?: string;
    onSelect?: (status: string) => void;
};

// 기존 -> 상태 배지 + 만료 배지를 표시만 함 (STATUS_BADGE_LEGEND)
// 변경 -> onSelect 가 있으면 상태 배지 클릭 시 STATUS_BADGES 키(공통 상태 라벨, 예: 결재진행중)를 넘김, 만료는 표시만
export function WorkCalendarStatusLegend({ selected, onSelect }: WorkCalendarStatusLegendProps) {
    return (
        <>
            {Object.entries(STATUS_BADGES).map(([status, badge]) => (
                <WorkCalendarStatusBadge
                    key={status}
                    {...badge}
                    selected={selected === status}
                    onClick={onSelect ? () => onSelect(status) : undefined}
                />
            ))}
            <WorkCalendarStatusBadge {...EXPIRATION_BADGE} />
        </>
    );
}

function getStatusBadge(approvalStatusType: string | undefined): StatusBadge | null {
    const { label } = resolveApprovalStatusView({ approvalStatusType });
    return STATUS_BADGES[label] ?? null;
}

// 기존 -> label, color, outlined 만 받는 표시용 배지
// 변경 -> 범례에서 쓸 때 selected(강조), onClick(클릭 + Enter/Space) 추가, 이벤트 칸에서는 넘기지 않음
export function WorkCalendarStatusBadge({
                                            label,
                                            color,
                                            outlined,
                                            selected,
                                            onClick,
                                        }: Pick<StatusBadge, 'label' | 'color' | 'outlined'> & {
    selected?: boolean;
    onClick?: () => void;
}) {
    return (
        <Box
            component="span"
            data-status-badge
            {...(onClick
                ? {
                    role: 'button',
                    tabIndex: 0,
                    onClick,
                    onKeyDown: (event: KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onClick();
                        }
                    },
                }
                : {})}
            sx={{
                ...(onClick ? { cursor: 'pointer' } : {}),
                ...(selected ? SELECTED_LEGEND_SX : {}),
                display: 'inline-block',
                mr: 0.5,
                px: 0.5,
                borderRadius: 0.5,
                fontSize: 10,
                fontWeight: 700,
                ...(outlined
                    ? {
                        lineHeight: '14px',
                        border: '1px solid',
                        borderColor: `${color}.main`,
                        bgcolor: 'background.paper',
                        color: `${color}.main`,
                    }
                    : {
                        lineHeight: 1.6,
                        bgcolor: `${color}.main`,
                        color: `${color}.contrastText`,
                    }),
            }}
        >
            {label}
        </Box>
    );
}

// 기존 -> 제목만 표시
// 변경 -> 임시저장·결재중·반려·승인이면 제목 앞에 상태 배지 (제목은 별도 span으로 검색 가능하게 유지)
export function WorkCalendarEventContent({
                                             event,
                                         }: EventProps<WorkCalendarEvent>) {
    const badge = event.expiration
        ? EXPIRATION_BADGE
        : getStatusBadge(event.resource.approvalStatusType);
    return (
        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {badge && (
                <WorkCalendarStatusBadge label={badge.short} color={badge.color} outlined={badge.outlined} />
            )}
            <span>{event.title}</span>
        </Typography>
    );
}