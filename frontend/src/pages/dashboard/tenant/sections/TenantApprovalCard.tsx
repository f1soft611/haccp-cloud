import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Card, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import { getDDayTone, getWorkCycleSx } from '../utils';
import styles from '../tenantDashboard.module.css';

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
        <Card variant="outlined" className={`${styles.workCard} ${styles.workCardApproval} ${styles.workCardFull}`}>
            <Box className={styles.cardBody}>
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" className={styles.chipRow}>
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
                            className={`${styles.cardChip} ${styles[getDDayTone(item.dDay)]}`}
                        />
                    ) : null}
                </Stack>

                <Typography variant="caption" noWrap component="div" className={styles.workCategory}>
                    {[sectionLabel, item.approvalRequestLabel].filter(Boolean).join(' | ')}
                </Typography>
                <Typography variant="subtitle1" noWrap className={styles.workTitle}>
                    {item.divisionName || item.title || '-'}
                </Typography>
            </Box>

            <Divider />

            <Stack direction="row" alignItems="center" spacing={1.5} className={styles.cardFooter}>
                <Typography variant="body2" noWrap className={styles.footerLabel}>
                    {'기안자 : '}
                    <Box component="span" className={styles.footerValue}>{item.createdBy || '-'}</Box>
                </Typography>
                <Typography variant="body2" noWrap className={`${styles.footerLabel} ${styles.footerGrow}`}>
                    {'작성시간 : '}
                    <Box component="span" className={styles.footerValue}>{submittedAt}</Box>
                </Typography>
                <IconButton
                    size="small"
                    color="primary"
                    aria-label="결재 문서 열기"
                    onClick={handleOpen}
                    className={styles.workCardButton}
                >
                    <EditOutlinedIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Card>
    );
}