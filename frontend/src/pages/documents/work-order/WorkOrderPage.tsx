import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
    createWorkOrder,
    deleteWorkOrder,
    listWorkOrdersPaged,
    updateWorkOrder,
} from '../../../services/documents/workOrderService';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import { WorkOrderFormDialog } from './components/WorkOrderFormDialog';
import { WorkOrderGrid } from './components/WorkOrderGrid';
import { WorkOrderSearchPanel } from './components/WorkOrderSearchPanel';
import {
    EMPTY_WORK_ORDER_SEARCH,
    type WorkOrderFormValue,
    type WorkOrderRow,
    type WorkOrderSearchValue,
} from './types';

export function WorkOrderPage() {
    // 기존 -> useState(SAMPLE_WORK_ORDERS) 화면 state 보관 + filterWorkOrderRows/slice 클라이언트 페이징
    // 변경 -> tb_workdirect API 를 React Query 로 서버 페이징 조회/저장
    const queryClient = useQueryClient();
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const [searchValue, setSearchValue] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const [appliedSearch, setAppliedSearch] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } = useGridPagination();
    const { showSuccess, showError } = useFeedback();

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<WorkOrderRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WorkOrderRow | null>(null);

    const queryKeyBase = ['documents-work-orders', tenantCode || 'self'];

    const workOrdersQuery = useQuery({
        queryKey: [...queryKeyBase, pageIndex, pageSize, appliedSearch],
        queryFn: () =>
            listWorkOrdersPaged({
                tenantCode: tenantCode || undefined,
                pageIndex,
                pageSize,
                startDate: appliedSearch.startDate || undefined,
                endDate: appliedSearch.endDate || undefined,
                keyword: appliedSearch.itemName.trim() || undefined,
            }),
        retry: false,
    });

    const refreshList = () => void queryClient.invalidateQueries({ queryKey: queryKeyBase });
    const handleError = (error: unknown) =>
        showError(extractApiErrorMessage(error, '작업지시를 처리하지 못했습니다.'));

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingRow(null);
    };

    const createMutation = useMutation({
        mutationFn: createWorkOrder,
        onSuccess: () => {
            handleCloseForm();
            resetPage();
            refreshList();
            showSuccess('등록되었습니다.');
        },
        onError: handleError,
    });

    const updateMutation = useMutation({
        mutationFn: updateWorkOrder,
        onSuccess: () => {
            handleCloseForm();
            refreshList();
            showSuccess('수정되었습니다.');
        },
        onError: handleError,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWorkOrder,
        onSuccess: () => {
            setDeleteTarget(null);
            // 기존 -> 마지막 페이지가 비면 이전 페이지로 이동 / 변경 -> 서버 페이징이므로 1페이지로 이동
            resetPage();
            refreshList();
            showSuccess('삭제되었습니다.');
        },
        onError: handleError,
    });

    const saving = createMutation.isPending || updateMutation.isPending;

    const handleSearch = () => {
        resetPage();
        setAppliedSearch(searchValue);
    };

    const handleReset = () => {
        resetPage();
        setSearchValue(EMPTY_WORK_ORDER_SEARCH);
        setAppliedSearch(EMPTY_WORK_ORDER_SEARCH);
    };

    const handleOpenCreate = () => {
        setEditingRow(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (row: WorkOrderRow) => {
        setEditingRow(row);
        setFormOpen(true);
    };

    const handleSubmit = (value: WorkOrderFormValue) => {
        const payload = { tenantCode: tenantCode || undefined, ...value };
        if (editingRow) {
            updateMutation.mutate({ ...payload, id: editingRow.id });
            return;
        }
        createMutation.mutate(payload);
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate({ tenantCode: tenantCode || undefined, id: deleteTarget.id });
    };

    return (
        <Stack spacing={2} data-testid="work-order-page">
            <PageHeader
                groupLabel={APP_LABELS.menu.documentGroup}
                title="작업지시등록"
                description="생산 품목별 작업지시를 등록하고 관리합니다."
            />

            {workOrdersQuery.isError ? (
                <Alert severity="warning">작업지시 목록을 불러오지 못했습니다.</Alert>
            ) : null}

            <WorkOrderSearchPanel
                value={searchValue}
                onChange={setSearchValue}
                onReset={handleReset}
                onSearch={handleSearch}
                onCreate={handleOpenCreate}
            />

            <WorkOrderGrid
                rows={workOrdersQuery.data?.items ?? []}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
            />

            <GridPaginationBar
                pageIndex={pageIndex}
                pageSize={pageSize}
                totalCount={workOrdersQuery.data?.totalCount ?? 0}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
            />

            <WorkOrderFormDialog
                open={formOpen}
                mode={editingRow ? 'edit' : 'create'}
                saving={saving}
                workdtNo={editingRow?.workdtNo}
                initialValue={editingRow ?? undefined}
                onClose={() => {
                    if (saving) return;
                    handleCloseForm();
                }}
                onSubmit={handleSubmit}
            />

            <ConfirmDialog
                open={deleteTarget !== null}
                title="작업지시 삭제"
                description={`'${deleteTarget?.workdtNo ?? ''} ${deleteTarget?.itemName ?? ''}' 작업지시를 삭제하시겠습니까?`}
                confirmText="삭제"
                confirmColor="error"
                loading={deleteMutation.isPending}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    if (deleteMutation.isPending) return;
                    setDeleteTarget(null);
                }}
            />
        </Stack>
    );
}