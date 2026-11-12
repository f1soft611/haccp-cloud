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
    const queryClient = useQueryClient();
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const [searchValue, setSearchValue] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const [appliedSearch, setAppliedSearch] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const [searchSeq, setSearchSeq] = useState(0);
    const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } = useGridPagination();
    const { showSuccess, showError } = useFeedback();

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<WorkOrderRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WorkOrderRow | null>(null);

    const queryKeyBase = ['documents-work-orders', tenantCode || 'self'];

    const workOrdersQuery = useQuery({
        queryKey: [...queryKeyBase, pageIndex, pageSize, appliedSearch, searchSeq],
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
        setSearchSeq((n) => n + 1); // 조회 버튼을 누를 때마다 key 를 바꿔 같은 조건이어도 서버에서 다시 가져온다
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