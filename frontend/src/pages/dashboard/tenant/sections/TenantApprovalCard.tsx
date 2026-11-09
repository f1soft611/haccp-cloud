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
    WORK_CARD_CATEGORY_SX,
    WORK_CARD_SX,
    WORK_CARD_TITLE_SX,
} from '../utils';

type TenantApprovalCardProps = {
    item: TenantTodoCardItem;
    sectionLabel: string;
};

// 카드 하단 라벨 글씨 (기안자, 작성시간)
const FOOTER_LABEL_SX = { fontSize: 14, fontWeight: 400, color: '#A8A8A8' };

// 카드 하단 값 글씨 (이름, 시각)
const FOOTER_VALUE_SX = { fontWeight: 500, color: '#444444' };

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
                    {[sectionLabel, item.approvalRequestLabel].filter(Boolean).join(' | ')}
                </Typography>
                <Typography variant="subtitle1" noWrap sx={WORK_CARD_TITLE_SX}>
                    {item.divisionName || item.title || '-'}
                </Typography>
            </Box>

            <Divider />

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="body2" noWrap sx={{ minWidth: 0, ...FOOTER_LABEL_SX }}>
                    {'기안자 : '}
                    <Box component="span" sx={FOOTER_VALUE_SX}>{item.createdBy || '-'}</Box>
                </Typography>
                <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0, ...FOOTER_LABEL_SX }}>
                    {'작성시간 : '}
                    <Box component="span" sx={FOOTER_VALUE_SX}>{submittedAt}</Box>
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