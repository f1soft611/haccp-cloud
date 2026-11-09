import type { KeyboardEvent } from 'react';
import { Box, Typography } from '@mui/material';
import type { EventProps } from 'react-big-calendar';
import {
    APPROVAL_STATUS_COLORS,
    getApprovalChipPaddingX,
    resolveApprovalStatusView,
} from '../../../../shared/utils/approvalStatus';
import type { WorkCalendarEvent } from '../hooks/useWorkCalendarData';
import { SELECTED_LEGEND_SX } from '../../../dashboard/tenant/utils';

type StatusBadge = {
    label: string;
    short: string;
    color: 'info' | 'warning' | 'error' | 'success';
    outlined?: boolean;
};

const STATUS_BADGES: Record<string, StatusBadge> = {
    결재진행중: { label: '결재진행중', short: '중', color: 'warning' },
    반려: { label: '반려', short: '반', color: 'error' },
    승인: { label: '승인', short: '승', color: 'success' },
};
const EXPIRATION_BADGE: StatusBadge = { label: '만료', short: '만', color: 'error', outlined: true };

// 범례 뱃지 공용 크기 (시안 칩과 동일)
const LEGEND_BADGE_SX = {
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    height: 24,
    mr: 0,
    borderRadius: '17px',
    fontSize: 12,
    lineHeight: 1,
};

type WorkCalendarStatusLegendProps = {
    selected?: string;
    onSelect?: (status: string) => void;
};

export function WorkCalendarStatusLegend({ selected, onSelect }: WorkCalendarStatusLegendProps) {
    return (
        <>
            {Object.entries(STATUS_BADGES).map(([status, badge]) => (
                <WorkCalendarStatusBadge
                    key={status}
                    {...badge}
                    status={status}
                    legend
                    selected={selected === status}
                    onClick={onSelect ? () => onSelect(status) : undefined}
                />
            ))}
            <WorkCalendarStatusBadge {...EXPIRATION_BADGE} legend />
        </>
    );
}

// 기존 -> StatusBadge | null 만 반환
// 변경 -> 배지 색을 상태 라벨로 정하므로 status(공통 상태 라벨)도 함께 반환
function getStatusBadge(approvalStatusType: string | undefined): (StatusBadge & { status?: string }) | null {
    const { label } = resolveApprovalStatusView({ approvalStatusType });
    const badge = STATUS_BADGES[label];
    return badge ? { ...badge, status: label } : null;
}

export function WorkCalendarStatusBadge({
                                            label,
                                            color,
                                            outlined,
                                            status,
                                            selected,
                                            onClick,
    legend,
                                        }: Pick<StatusBadge, 'label' | 'color' | 'outlined'> & {
    // 기존 -> 없음 / 변경 -> 공통 상태 라벨(결재진행중, 반려, 승인), 디자인 색 조회용
    status?: string;
    selected?: boolean;
    onClick?: () => void;
    legend?: boolean;
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
                        bgcolor: APPROVAL_STATUS_COLORS[status ?? '']?.bg ?? `${color}.main`,
                        color: APPROVAL_STATUS_COLORS[status ?? '']?.color ?? `${color}.contrastText`,
                    }),
                ...(legend
                    ? {
                        ...LEGEND_BADGE_SX,
                        px: outlined ? '9px' : getApprovalChipPaddingX(status ?? ''),
                    }
                    : {}),
            }}
        >
            {label}
        </Box>
    );
}

export function WorkCalendarEventContent({
                                             event,
                                         }: EventProps<WorkCalendarEvent>) {
    // 기존 -> 타입 추론 / 변경 -> 만료 배지는 status 없음을 타입에 명시
    const badge: (StatusBadge & { status?: string }) | null = event.expiration
        ? EXPIRATION_BADGE
        : getStatusBadge(event.resource.approvalStatusType);
    return (
        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {badge && (
                // 기존 -> status 없이 label, color, outlined 만 / 변경 -> 상태 배지는 status 로 디자인 색 적용 (만료는 status 없음)
                <WorkCalendarStatusBadge
                    label={badge.short}
                    color={badge.color}
                    outlined={badge.outlined}
                    status={badge.status}
                />
            )}
            <span>{event.title}</span>
        </Typography>
    );
}