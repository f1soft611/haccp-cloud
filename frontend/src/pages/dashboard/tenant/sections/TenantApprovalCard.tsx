import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Card, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import {
    APPROVAL_CARD_TOP_COLOR,
    CARD_CHIP_SX,
    getDDayColor,
    getWorkCycleSx,
    WORK_CARD_BUTTON_SX,
    WORK_CARD_SX,
} from '../utils';

type TenantApprovalCardProps = {
    item: TenantTodoCardItem;
    sectionLabel: string;
};

// 나의 담당업무의 결재할문서 카드: 요청 구분, 기안자, 상신 시각을 보여주고 결재 문서로 이동
export function TenantApprovalCard({ item, sectionLabel }: TenantApprovalCardProps) {
    const navigate = useNavigate();

    const handleOpen = () => {
        const path = resolveDraftRoute(item);
        if (path) navigate(path);
    };

    const submittedAt = item.submittedAt ? dayjs(item.submittedAt).format('YY.MM.DD HH:mm') : '-';

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                ...WORK_CARD_SX,
                borderTop: `3px solid ${APPROVAL_CARD_TOP_COLOR}`,
            }}
        >
            <Box sx={{ flexGrow: 1, px: 2.5, pt: 2, pb: 2 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" mb={1}>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={item.cycleName || item.cycle || '-'}
                        sx={{ ...CARD_CHIP_SX, ...getWorkCycleSx(item.cycle) }}
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

                <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {[sectionLabel, item.approvalRequestLabel].filter(Boolean).join(' | ')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {item.divisionName || item.title || '-'}
                </Typography>
            </Box>

            <Divider />

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
                    {`기안자 : ${item.createdBy || '-'}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                    {`작성시간 : ${submittedAt}`}
                </Typography>
                <IconButton
                    size="small"
                    color="primary"
                    aria-label="결재 문서 열기"
                    onClick={handleOpen}
                    sx={{
                        ...WORK_CARD_BUTTON_SX,
                        borderRadius: '4px',
                        flexShrink: 0,
                        height: 30,
                    }}
                >
                    <EditOutlinedIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Card>
    );
}