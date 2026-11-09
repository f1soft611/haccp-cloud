import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, Card, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import { useOpenWorkDraft } from '../../../../shared/hooks/useOpenWorkDraft';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import {
    CARD_CHIP_SX,
    DRAFT_CARD_TOP_COLOR,
    getDDayColor,
    getWorkCycleSx,
    WORK_CARD_BUTTON_SX,
    WORK_CARD_CATEGORY_SX,
    WORK_CARD_SX,
    WORK_CARD_TITLE_SX,
} from '../utils';
import {ApprovalStatusChip} from "../../../../shared/components/data/ApprovalStatusChip.tsx";

type TenantTodoCardProps = {
    item: TenantTodoCardItem;
    sectionLabel: string;
};

// 나의 담당업무의 기안문서 카드: 진행상태, 담당 결재자, 미작성 건수를 보여주고 작성 화면으로 이동
// 기안문서 전용. 결재할문서는 TenantApprovalCard 에서 처리
export function TenantTodoCard({ item, sectionLabel }: TenantTodoCardProps) {
    const navigate = useNavigate();
    const { openWorkDraft, dialog } = useOpenWorkDraft();

    const statusLabel = resolveApprovalStatusView({
        approvalStatusType: item.approvalStatusType,
        approvalStatusTypeName: item.approvalStatusTypeName,
        todoStatus: item.status,
        writtenInCycle: item.writtenInCycle,
    }).label;

    const handleUnwritten = () => {
        const query = new URLSearchParams({ workType: sectionLabel, workDivisionId: item.id, status: '미작성' });
        navigate(`/docs/haccp-doc?${query.toString()}`);
    };

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    ...WORK_CARD_SX,
                    borderTop: `3px solid ${DRAFT_CARD_TOP_COLOR}`,
                }}
            >
                <Box sx={{ flexGrow: 1, px: 2.5, pt: 2, pb: 2 }}>
                    {/* 기존 -> 칩 왼쪽 정렬, 아래 여백 16px / 변경 -> 시안대로 오른쪽 정렬, 아래 여백 8px */}
                    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" mb={1}>
                        <ApprovalStatusChip label={statusLabel} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={item.cycleName || item.cycle || '-'}
                            sx={getWorkCycleSx(item.cycle)}
                        />
                        {item.dDay ? (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={item.dDay}
                                sx={{ ...CARD_CHIP_SX, color: getDDayColor(item.dDay), borderColor: 'divider' }}
                            />
                        ) : null}
                    </Stack>

                    <Typography variant="caption" noWrap component="div" sx={WORK_CARD_CATEGORY_SX}>
                        {sectionLabel}
                    </Typography>
                    <Typography variant="subtitle1" noWrap mb={0.5} sx={WORK_CARD_TITLE_SX}>
                        {item.divisionName || item.title || '-'}
                    </Typography>
                    <Typography variant="body2" noWrap sx={{ fontSize: 14, fontWeight: 400, color: '#8E8E8E' }}>
                        {`검토 : ${item.reviewerName || '-'} | 승인 : ${item.approverName || '-'}`}
                    </Typography>
                </Box>

                <Divider />

                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 1.5 }}>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ flexGrow: 1, minWidth: 0, fontSize: 14, fontWeight: 400, color: '#8A8A8A' }}
                    >
                        {`최신 : ${item.updatedAt ? item.updatedAt.slice(0, 10) : '-'} / ${item.lastWriterName || '-'}`}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        aria-label={`미작성 ${item.unwrittenCount}건`}
                        onClick={handleUnwritten}
                        sx={{
                            ...WORK_CARD_BUTTON_SX,
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontSize: 12,
                            height: 30,
                        }}
                    >
                        미작성건 :&nbsp;
                        <Box component="span" sx={{ textDecoration: 'underline' }}>{item.unwrittenCount}</Box>
                    </Button>
                    <IconButton
                        size="small"
                        color="primary"
                        aria-label="오늘 작성"
                        onClick={() => void openWorkDraft(item.id)}
                        sx={{
                            ...WORK_CARD_BUTTON_SX,
                            borderRadius: '4px',
                            flexShrink: 0,
                            height: 30
                        }}
                    >
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Card>
            {dialog}
        </>
    );
}