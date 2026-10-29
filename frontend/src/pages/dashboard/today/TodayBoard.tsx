import type { ReactNode } from 'react';
import { Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useOpenWorkDraft } from '../../../shared/hooks/useOpenWorkDraft';
import { resolveDraftRoute, resolveExpirationDraftRoute } from '../../../shared/utils/workDraftRoute';
import type { TenantTodoCardItem } from '../tenant/hooks/useTenantDashboardData';
import { getWorkCycleSx } from '../tenant/utils';
import { formatElapsed, getDueBadge, workName, type TodayBoardData } from './todayRules';

type TodayBoardProps = {
    board: TodayBoardData;
    approvals: TenantTodoCardItem[];
    today: Date;
    isTodoLoading: boolean;
    isTodoError: boolean;
    isApprovalLoading: boolean;
    isHistoryLoading: boolean;
};

type BoardColumnProps = {
    title: string;
    count: number;
    isLoading: boolean;
    emptyText: string;
    children: ReactNode;
};

function BoardColumn({ title, count, isLoading, emptyText, children }: BoardColumnProps) {
    return (
        <Paper
            sx={{ p: 1.5, flex: 1, minWidth: 0, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
        >
            <Typography variant="subtitle2" fontWeight={800}>
                {title}{' '}
                <Typography component="span" variant="subtitle2" color="text.secondary">
                    {isLoading ? '' : count}
                </Typography>
            </Typography>
            <Stack
                spacing={1}
                sx={{
                    mt: 1,
                    maxHeight: 360,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',                      // Firefox
                    '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Edge, Safari
                }}
            >

            {isLoading ? (
                    [1, 2].map((key) => <Skeleton key={key} variant="rounded" height={64} />)
                ) : count === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        {emptyText}
                    </Typography>
                ) : (
                    children
                )}
            </Stack>
        </Paper>
    );
}

type BoardCardProps = {
    name: string;
    badge?: ReactNode;
    meta: ReactNode;
    actionLabel: string;
    onAction: () => void;
    danger?: boolean;
};

function BoardCard({ name, badge, meta, actionLabel, onAction, danger = false }: BoardCardProps) {
    return (
        <Paper variant="outlined" sx={{ p: 1.25, borderColor: danger ? 'error.light' : 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700} noWrap>
                    {name}
                </Typography>
                {badge}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                <Typography component="div" variant="caption" color="text.secondary" noWrap>
                    {meta}
                </Typography>
                <Button size="small" variant="outlined" onClick={onAction}>
                    {actionLabel}
                </Button>
            </Stack>
        </Paper>
    );
}

function CycleChip({ item }: { item: TenantTodoCardItem }) {
    return (
        <Chip
            size="small"
            label={item.cycleName || item.cycle || '-'}
            sx={{ height: 20, fontWeight: 700, ...getWorkCycleSx(item.cycle) }}
        />
    );
}

function ExpirationChip() {
    return <Chip size="small" label="만료" color="error" variant="outlined" sx={{ height: 20, fontWeight: 700 }} />;
}

export function TodayBoard(props: TodayBoardProps) {
    const { board, approvals, today, isTodoLoading, isTodoError, isApprovalLoading, isHistoryLoading } = props;
    const navigate = useNavigate();
    const { openWorkDraft, dialog } = useOpenWorkDraft();
    const todoEmpty = (text: string) => (isTodoError ? '불러오지 못했습니다.' : text);
    const openDocument = (item: TenantTodoCardItem) => {
        const path = resolveDraftRoute(item);
        if (path) {
            navigate(path);
        }
    };

    return (
        <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
                <BoardColumn
                    title="작성할 업무"
                    count={board.write.length}
                    // 기존 -> isTodoLoading / 변경 -> 만료 건이 주기 조회에서 오므로 함께 기다림
                    isLoading={isTodoLoading || isHistoryLoading}
                    emptyText={todoEmpty('이번 주기 작성을 모두 마쳤어요')}
                >
                    {board.write.map((item) => {
                        const due = getDueBadge(item.dueDate, today);
                        const { expiration } = item;
                        return (
                            <BoardCard
                                key={expiration ? `expiration-${expiration.approvalId}` : item.id}
                                name={expiration ? item.title : workName(item)}
                                badge={
                                    <Chip
                                        size="small"
                                        label={due.label}
                                        color={due.color}
                                        variant={due.variant}
                                        sx={{ height: 20, fontWeight: 700 }}
                                    />
                                }
                                meta={expiration ? <ExpirationChip /> : <CycleChip item={item} />}
                                actionLabel="작성"
                                onAction={() =>
                                    expiration
                                        ? navigate(resolveExpirationDraftRoute(expiration))
                                        : void openWorkDraft(item.id)
                                }
                            />
                        );
                    })}
                </BoardColumn>

                <BoardColumn
                    title="결재할 문서"
                    count={approvals.length}
                    isLoading={isApprovalLoading}
                    emptyText="결재할 문서가 없어요"
                >
                    {approvals.map((item) => (
                        <BoardCard
                            key={item.routeId}
                            name={item.title || workName(item)}
                            meta={`${item.createdBy || '-'} 상신, ${formatElapsed(item.updatedAt, today)}`}
                            actionLabel="결재"
                            onAction={() => openDocument(item)}
                        />
                    ))}
                </BoardColumn>

                <BoardColumn
                    title="반려, 다시 작성"
                    count={board.rejected.length}
                    isLoading={isTodoLoading}
                    emptyText={todoEmpty('반려된 문서가 없어요')}
                >
                    {board.rejected.map((item) => (
                        <BoardCard
                            key={item.id}
                            danger
                            name={workName(item)}
                            badge={<CycleChip item={item} />}
                            meta={`${formatElapsed(item.latestStatusAt, today)} 반려`}
                            actionLabel="수정"
                            onAction={() => openDocument(item)}
                        />
                    ))}
                </BoardColumn>
            </Stack>
            {dialog}
        </>
    );
}