import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, Card, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import { useOpenWorkDraft } from '../../../../shared/hooks/useOpenWorkDraft';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import { getWorkCycleSx } from '../utils';

type TenantTodoCardProps = {
    item: TenantTodoCardItem;
    sectionLabel: string;
    pendingApproval?: boolean;
};

const CHIP_SX = { height: 22, fontWeight: 700, fontSize: 12 };

export function TenantTodoCard({ item, sectionLabel, pendingApproval = false }: TenantTodoCardProps) {
    const navigate = useNavigate();
    const { openWorkDraft, dialog } = useOpenWorkDraft();

    const { label: statusLabel, color: statusColor } = pendingApproval
        ? { label: '결재할문서', color: 'secondary' as const }
        : resolveApprovalStatusView({
            approvalStatusType: item.approvalStatusType,
            approvalStatusTypeName: item.approvalStatusTypeName,
            todoStatus: item.status,
            writtenInCycle: item.writtenInCycle,
        });

    const dDayColor = item.dDay.startsWith('D+')
        ? 'error.main'
        : item.dDay === 'D-Day'
            ? 'warning.main'
            : 'text.secondary';

    const handleWrite = () => {
        if (!pendingApproval) {
            void openWorkDraft(item.id);
            return;
        }
        const path = resolveDraftRoute(item);
        if (path) navigate(path);
    };

    const handleUnwritten = () => {
        // ponytail: 미작성 목록 화면은 별도 설계 예정, 일단 HACCP 문서 목록으로 이동
        const query = new URLSearchParams({ workType: sectionLabel, workDivisionId: item.id });
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
                    borderColor: 'divider',
                    borderTop: '3px solid',
                    borderTopColor: 'primary.main',
                    borderRadius: '4px',
                }}
            >
                <Box sx={{ flexGrow: 1, px: 2.5, pt: 2, pb: 2 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" mb={2}>
                        <Chip size="small" label={statusLabel} color={statusColor} sx={CHIP_SX} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={item.cycleName || item.cycle || '-'}
                            sx={{ ...CHIP_SX, ...getWorkCycleSx(item.cycle) }}
                        />
                        {item.dDay ? (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={item.dDay}
                                sx={{ ...CHIP_SX, color: dDayColor, borderColor: 'divider' }}
                            />
                        ) : null}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {sectionLabel}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} noWrap mb={0.5}>
                        {item.divisionName || item.title || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {`검토:${item.reviewerName || '-'}  /  승인:${item.approverName || '-'}`}
                    </Typography>
                </Box>

                <Divider />

                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                        {`최신 : ${item.updatedAt ? item.updatedAt.slice(0, 10) : '-'} / ${item.lastWriterName || '-'}`}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color={item.unwrittenCount > 0 ? 'error' : 'primary'}
                        startIcon={<DescriptionOutlinedIcon />}
                        aria-label={`미작성 ${item.unwrittenCount}건`}
                        onClick={handleUnwritten}
                        sx={{
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
                        onClick={handleWrite}
                        sx={{
                            border: '1px solid',
                            borderColor: 'primary.main',
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