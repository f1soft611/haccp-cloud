import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import { Box, Button, Card, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import { useOpenWorkDraft } from '../../../../shared/hooks/useOpenWorkDraft';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import { getDDayTone, getWorkCycleSx } from '../utils';
import styles from '../tenantDashboard.module.css';
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
            <Card variant="outlined" className={`${styles.workCard} ${styles.workCardDraft} ${styles.workCardFull}`}>
                <Box className={styles.cardBody}>
                    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" className={styles.chipRow}>
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
                                className={`${styles.cardChip} ${styles[getDDayTone(item.dDay)]}`}
                            />
                        ) : null}
                    </Stack>

                    <Typography variant="caption" noWrap component="div" className={styles.workCategory}>
                        {sectionLabel}
                    </Typography>
                    <Typography variant="subtitle1" noWrap className={`${styles.workTitle} ${styles.workTitleGap}`}>
                        {item.divisionName || item.title || '-'}
                    </Typography>
                    <Typography variant="body2" noWrap className={styles.reviewLine}>
                        {`검토 : ${item.reviewerName || '-'} | 승인 : ${item.approverName || '-'}`}
                    </Typography>
                </Box>

                <Divider />

                <Stack direction="row" alignItems="center" spacing={1} className={styles.cardFooter}>
                    <Typography variant="body2" noWrap className={styles.updatedText}>
                        {`최신 : ${item.updatedAt ? item.updatedAt.slice(0, 10) : '-'} / ${item.lastWriterName || '-'}`}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        aria-label={`미작성 ${item.unwrittenCount}건`}
                        onClick={handleUnwritten}
                        className={`${styles.workCardButton} ${styles.unwrittenButton}`}
                    >
                        미작성건 :&nbsp;
                        <Box component="span" className={styles.underline}>{item.unwrittenCount}</Box>
                    </Button>
                    <IconButton
                        size="small"
                        color="primary"
                        aria-label="오늘 작성"
                        onClick={() => void openWorkDraft(item.id)}
                        className={styles.workCardButton}
                    >
                        {/* 기존 -> MUI EditOutlinedIcon / 변경 -> 시안 bticon_wri.svg 아이콘 */}
                        <EditPencilIcon />
                    </IconButton>
                </Stack>
            </Card>
            {dialog}
        </>
    );
}