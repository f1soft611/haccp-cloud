import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    applyMigration,
    getMigrationDetail,
    getMigrations,
    type MigrationItem,
} from '../../../services/platform-admin/migrationService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';

const STATUS_COLOR: Record<
    string,
    'success' | 'error' | 'default' | 'warning'
> = {
    APPLIED: 'success',
    SUCCESS: 'success',
    FAILED: 'error',
    ERROR: 'error',
    PENDING: 'default',
    SKIPPED: 'default',
    BLOCKED: 'warning',
};

function errorMessage(error: unknown): string {
    return (error as { message?: string })?.message ?? '요청 처리 중 오류가 발생했습니다.';
}

export function MigrationPage() {
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<MigrationItem | null>(null);

    const listQuery = useQuery({
        queryKey: ['platform-migrations'],
        queryFn: getMigrations,
    });

    const detailQuery = useQuery({
        queryKey: ['platform-migration', selectedId],
        queryFn: () => getMigrationDetail(selectedId as string),
        enabled: Boolean(selectedId),
    });

    const applyMutation = useMutation({
        mutationFn: applyMigration,
        onSuccess: (_results, migrationId) => {
            setSelectedId(migrationId);
            void queryClient.invalidateQueries({ queryKey: ['platform-migrations'] });
            void queryClient.invalidateQueries({
                queryKey: ['platform-migration', migrationId],
            });
        },
    });

    const migrations = listQuery.data ?? [];

    return (
        <Stack spacing={2}>
            <PageHeader
                groupLabel={APP_LABELS.menu.systemGroup}
                title={APP_LABELS.pageTitle.schemaMigration}
                description="sql/migrations 의 변경 스크립트를 central 과 전체 테넌트 DB 에 적용합니다."
            />

            {listQuery.isError && (
                <Alert severity="error">{errorMessage(listQuery.error)}</Alert>
            )}
            {applyMutation.isError && (
                <Alert severity="error">{errorMessage(applyMutation.error)}</Alert>
            )}
            {applyMutation.isSuccess && (
                <Alert severity="info">
                    적용 결과:{' '}
                    {applyMutation.data
                    .map((row) => `${row.dbName} ${row.result}`)
                    .join(', ')}
                </Alert>
            )}

            <AdminGrid ariaLabel="마이그레이션 목록">
                <TableHead>
                    <TableRow>
                        <TableCell>파일</TableCell>
                        <TableCell align="right">적용</TableCell>
                        <TableCell align="right">실패</TableCell>
                        <TableCell align="right">미적용</TableCell>
                        <TableCell align="right">선행 대기</TableCell>
                        <TableCell align="center">실행</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {migrations.length === 0 && !listQuery.isLoading && (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                등록된 마이그레이션이 없습니다.
                            </TableCell>
                        </TableRow>
                    )}
                    {migrations.map((item) => (
                        <TableRow
                            key={item.migrationId}
                            hover
                            selected={item.migrationId === selectedId}
                            onClick={() => setSelectedId(item.migrationId)}
                            sx={{ cursor: 'pointer' }}
                        >
                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                {item.migrationId}
                            </TableCell>
                            <TableCell align="right">{item.appliedCount}</TableCell>
                            <TableCell align="right">{item.failedCount}</TableCell>
                            <TableCell align="right">{item.pendingCount}</TableCell>
                            <TableCell align="right">{item.blockedCount}</TableCell>
                            <TableCell align="center">
                                <Button
                                    size="small"
                                    variant="contained"
                                    disabled={!item.runnable || applyMutation.isPending}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setConfirmTarget(item);
                                    }}
                                >
                                    실행
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </AdminGrid>

            {selectedId && detailQuery.data && (
                <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {selectedId}
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            m: 0,
                            p: 1.5,
                            maxHeight: 320,
                            overflow: 'auto',
                            bgcolor: '#f6f8f8',
                            border: '1px solid rgba(66, 111, 106, 0.24)',
                            fontFamily: 'monospace',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {detailQuery.data.sql}
                    </Box>
                    <AdminGrid ariaLabel="DB별 적용 상태">
                        <TableHead>
                            <TableRow>
                                <TableCell>DB</TableCell>
                                <TableCell>상태</TableCell>
                                <TableCell>적용 시각</TableCell>
                                <TableCell>실행자</TableCell>
                                <TableCell>에러</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {detailQuery.data.databases.map((row) => (
                                <TableRow key={row.dbName}>
                                    <TableCell>{row.dbName}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={row.status}
                                            color={STATUS_COLOR[row.status] ?? 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{row.appliedAt ?? '-'}</TableCell>
                                    <TableCell>{row.appliedBy ?? '-'}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>
                                        {row.errorMessage ?? ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </AdminGrid>
                </Stack>
            )}

            <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)}>
                <DialogTitle>마이그레이션 실행</DialogTitle>
                <DialogContent>
                    {confirmTarget && (
                        <Typography>
                            {confirmTarget.migrationId} 를{' '}
                            {confirmTarget.pendingCount + confirmTarget.failedCount}개 DB 에
                            적용합니다.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmTarget(null)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (confirmTarget) {
                                applyMutation.mutate(confirmTarget.migrationId);
                            }
                            setConfirmTarget(null);
                        }}
                    >
                        실행
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}