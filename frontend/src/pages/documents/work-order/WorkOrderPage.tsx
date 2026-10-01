// 기존 -> import { Alert, Stack, type AlertColor } from '@mui/material';
// 변경 -> 공통 알림(useFeedback) / 확인창(ConfirmDialog) 사용
import { Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { WorkOrderGrid } from './components/WorkOrderGrid';
import { WorkOrderSearchPanel } from './components/WorkOrderSearchPanel';
import {
    EMPTY_WORK_ORDER_SEARCH,
    type WorkOrderRow,
    type WorkOrderSearchValue,
} from './types';
import {
    SAMPLE_WORK_ORDERS,
    createEmptyWorkOrderRow,
    filterWorkOrderRows,
    validateWorkOrderRows,
} from './workOrderRows';

export function WorkOrderPage() {
    const [rows, setRows] = useState<WorkOrderRow[]>(SAMPLE_WORK_ORDERS);
    const [searchValue, setSearchValue] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const [appliedSearch, setAppliedSearch] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    // 기존 -> const [message, setMessage] = useState<{ severity: AlertColor; text: string } | null>(null);
    // 변경 -> 공통 스낵바 알림 + ConfirmDialog 상태
    const { showSuccess, showError, showInfo } = useFeedback();
    const [confirmState, setConfirmState] = useState<{
        title: string;
        description: string;
        confirmText: string;
        confirmColor: 'primary' | 'error' | 'warning';
        onConfirm: () => void;
    } | null>(null);

    const visibleRows = useMemo(
        () => filterWorkOrderRows(rows, appliedSearch),
        [rows, appliedSearch],
    );
    const hasUnsaved = rows.some((row) => row.rowState !== 'saved');

    const applySearch = (next: WorkOrderSearchValue) => {
        // 기존 -> window.confirm('저장하지 않은 변경사항이 있습니다. 계속 조회하시겠습니까?')
        // 변경 -> ConfirmDialog로 확인
        if (!hasUnsaved) {
            setAppliedSearch(next);
            return;
        }
        setConfirmState({
            title: '조회',
            description: '저장하지 않은 변경사항이 있습니다. 계속 조회하시겠습니까?',
            confirmText: '조회',
            confirmColor: 'warning',
            onConfirm: () => setAppliedSearch(next),
        });
    };

    const handleReset = () => {
        setSearchValue(EMPTY_WORK_ORDER_SEARCH);
        applySearch(EMPTY_WORK_ORDER_SEARCH);
    };

    const handleRowUpdate = (updated: WorkOrderRow) => {
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    };

    const handleAdd = () => {
        setRows((prev) => [createEmptyWorkOrderRow(), ...prev]);
    };

    const handleSave = () => {
        if (!hasUnsaved) {
            showInfo('저장할 내용이 없습니다.');
            return;
        }
        const error = validateWorkOrderRows(rows);
        if (error) {
            showError(error);
            return;
        }
        // ponytail: 백엔드 API 연동 전까지 화면 상태만 저장 처리
        setRows((prev) => prev.map((row) => ({ ...row, rowState: 'saved' })));
        showSuccess('저장되었습니다.');
    };

    const handleDelete = (ids: string[]) => {
        if (ids.length === 0) {
            showInfo('삭제할 행을 선택하세요.');
            return;
        }
        // 기존 -> window.confirm(`선택한 ${ids.length}건을 삭제하시겠습니까?`)
        // 변경 -> ConfirmDialog로 확인 후 삭제, 결과는 공통 스낵바로 알림
        const targetIds = new Set(ids);
        setConfirmState({
            title: '삭제',
            description: `선택한 ${ids.length}건을 삭제하시겠습니까?`,
            confirmText: '삭제',
            confirmColor: 'error',
            onConfirm: () => {
                setRows((prev) => prev.filter((row) => !targetIds.has(row.id)));
                showSuccess('삭제되었습니다.');
            },
        });
    };

    return (
        <Stack spacing={2} data-testid="work-order-page">
            <PageHeader
                groupLabel={APP_LABELS.menu.documentGroup}
                title="작업지시등록"
                description="생산 품목별 작업지시를 등록하고 관리합니다."
            />

            <WorkOrderSearchPanel
                value={searchValue}
                onChange={setSearchValue}
                onReset={handleReset}
                onSearch={() => applySearch(searchValue)}
            />

            <WorkOrderGrid
                rows={visibleRows}
                onRowUpdate={handleRowUpdate}
                onAdd={handleAdd}
                onSave={handleSave}
                onRequestApproval={() => showInfo('준비 중인 기능입니다.')}
                onDelete={handleDelete}
            />

            <ConfirmDialog
                open={confirmState !== null}
                title={confirmState?.title ?? ''}
                description={confirmState?.description ?? ''}
                confirmText={confirmState?.confirmText ?? '확인'}
                confirmColor={confirmState?.confirmColor ?? 'primary'}
                onConfirm={() => {
                    confirmState?.onConfirm();
                    setConfirmState(null);
                }}
                onClose={() => setConfirmState(null)}
            />
        </Stack>
    );
}