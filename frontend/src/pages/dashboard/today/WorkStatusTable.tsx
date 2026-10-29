import {
    Box,
    Button,
    Chip,
    Skeleton,
    Stack,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { resolveApprovalStatusView } from '../../../shared/utils/approvalStatus';
import type { TenantTodoCardItem } from '../tenant/hooks/useTenantDashboardData';
import { getWorkCycleSx } from '../tenant/utils';
import { formatElapsed, workName, type HistoryCell } from './todayRules';

const COLUMN_COUNT = 7;

const HISTORY_COLORS: Record<string, string> = {
    승인: 'success.main',
    결재진행중: 'warning.main',
    반려: 'error.main',
    임시저장: 'info.light',
};

const LEGEND = [
    { label: '승인', color: HISTORY_COLORS.승인 },
    { label: '결재진행중', color: HISTORY_COLORS.결재진행중 },
    { label: '반려', color: HISTORY_COLORS.반려 },
    { label: '임시저장', color: HISTORY_COLORS.임시저장 },
    { label: '미작성', color: 'grey.300' },
];

function HistoryBox({ color, current = false }: { color: string; current?: boolean }) {
    return (
        <Box
            sx={{
                width: 14,
                height: 14,
                borderRadius: 0.75,
                bgcolor: color,
                ...(current ? { outline: '2px dashed', outlineColor: 'text.secondary', outlineOffset: 1 } : {}),
            }}
        />
    );
}

function HistoryStrip({ cells }: { cells: HistoryCell[] }) {
    return (
        <Stack direction="row" spacing={0.6} justifyContent="center">
            {cells.map((cell, index) => (
                <Tooltip key={cell.cycleDate} title={`${cell.cycleDate} ${cell.label}`} arrow>
          <span>
            <HistoryBox color={HISTORY_COLORS[cell.label] ?? 'grey.300'} current={index === cells.length - 1} />
          </span>
                </Tooltip>
            ))}
        </Stack>
    );
}

type WorkStatusTableProps = {
    rows: TenantTodoCardItem[];
    historyByWork: Map<string, HistoryCell[]>;
    today: Date;
    isLoading: boolean;
    isError: boolean;
    isHistoryLoading: boolean;
};

export function WorkStatusTable(props: WorkStatusTableProps) {
    const { rows, historyByWork, today, isLoading, isError, isHistoryLoading } = props;
    const navigate = useNavigate();

    const openDocs = (item: TenantTodoCardItem) => {
        const query = new URLSearchParams({
            workType: item.categoryName || item.categoryCode || '기타문서',
            startDate: dayjs(today).startOf('month').format('YYYY-MM-DD'),
            endDate: dayjs(today).format('YYYY-MM-DD'),
        });
        navigate(`/docs/haccp-doc?${query.toString()}`);
    };

    return (
        <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" fontWeight={800}>
                    업무별 현황
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {LEGEND.map((legend) => (
                        <Stack key={legend.label} direction="row" spacing={0.5} alignItems="center">
                            <HistoryBox color={legend.color} />
                            <Typography variant="caption" color="text.secondary">
                                {legend.label}
                            </Typography>
                        </Stack>
                    ))}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <HistoryBox color="transparent" current />
                        <Typography variant="caption" color="text.secondary">
                            이번 주기
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>

            <AdminGrid ariaLabel="업무별 현황" maxHeight={560}>
                <TableHead>
                    <TableRow>
                        <TableCell align="center" width={160}>업무분류</TableCell>
                        <TableCell align="center" sx={{ minWidth: 180 }}>업무명</TableCell>
                        <TableCell align="center" width={90}>주기</TableCell>
                        <TableCell align="center" width={170}>최근 이력</TableCell>
                        <TableCell align="center" width={150}>최근작성일</TableCell>
                        <TableCell align="center" width={110}>상태</TableCell>
                        <TableCell align="center" width={90}>조회</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (
                        [1, 2, 3].map((skeletonId) => (
                            <TableRow key={`status-skeleton-${skeletonId}`}>
                                {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
                                    <TableCell key={cellIndex}>
                                        <Skeleton variant="text" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COLUMN_COUNT} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    {isError ? '불러오지 못했습니다.' : '등록된 업무가 없습니다.'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((item) => {
                            const status = resolveApprovalStatusView({
                                approvalStatusType: item.approvalStatusType,
                                approvalStatusTypeName: item.approvalStatusTypeName,
                                todoStatus: item.status,
                                writtenInCycle: item.writtenInCycle,
                            });
                            const cells = item.cycle === 'ANYTIME' ? [] : (historyByWork.get(item.id) ?? []);

                            return (
                                <TableRow key={item.id} hover>
                                    <TableCell align="center">{item.categoryName || '기타문서'}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {workName(item)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            size="small"
                                            label={item.cycleName || item.cycle || '-'}
                                            sx={{ height: 22, fontWeight: 700, ...getWorkCycleSx(item.cycle) }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {isHistoryLoading ? (
                                            <Skeleton variant="text" />
                                        ) : cells.length > 0 ? (
                                            <HistoryStrip cells={cells} />
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {item.updatedAt ? (
                                            <>
                                                {item.updatedAt}
                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                                                    {formatElapsed(item.updatedAt, today)}
                                                </Typography>
                                            </>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip size="small" label={status.label} color={status.color} sx={{ height: 20, fontWeight: 700 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button size="small" variant="outlined" onClick={() => openDocs(item)}>
                                            조회
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </AdminGrid>
        </Stack>
    );
}