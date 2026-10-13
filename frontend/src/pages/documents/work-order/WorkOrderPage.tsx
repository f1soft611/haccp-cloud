import { Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { WorkOrderFormDialog } from './components/WorkOrderFormDialog';
import { WorkOrderGrid } from './components/WorkOrderGrid';
import { WorkOrderSearchPanel } from './components/WorkOrderSearchPanel';
import {
    EMPTY_WORK_ORDER_SEARCH,
    type WorkOrderFormValue,
    type WorkOrderRow,
    type WorkOrderSearchValue,
} from './types';
import { SAMPLE_WORK_ORDERS, filterWorkOrderRows } from './workOrderRows';

export function WorkOrderPage() {
    // ponytail: 백엔드 API 연동 전까지 화면 state 로만 보관
    const [rows, setRows] = useState<WorkOrderRow[]>(SAMPLE_WORK_ORDERS);
    const [searchValue, setSearchValue] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const [appliedSearch, setAppliedSearch] = useState<WorkOrderSearchValue>(EMPTY_WORK_ORDER_SEARCH);
    const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } = useGridPagination();
    const { showSuccess } = useFeedback();

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<WorkOrderRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WorkOrderRow | null>(null);

    const filteredRows = useMemo(
        () => filterWorkOrderRows(rows, appliedSearch),
        [rows, appliedSearch],
    );
    // 삭제로 마지막 페이지가 비면 이전 페이지를 보여준다
    const lastPage = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(pageIndex, lastPage);
    const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingRow(null);
    };

    const handleSubmit = (value: WorkOrderFormValue) => {
        if (editingRow) {
            setRows((prev) =>
                prev.map((row) => (row.id === editingRow.id ? { ...value, id: editingRow.id } : row)),
            );
            showSuccess('수정되었습니다.');
        } else {
            setRows((prev) => [{ ...value, id: crypto.randomUUID() }, ...prev]);
            resetPage();
            showSuccess('등록되었습니다.');
        }
        handleCloseForm();
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
        setDeleteTarget(null);
        showSuccess('삭제되었습니다.');
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
                onSearch={handleSearch}
                onCreate={handleOpenCreate}
            />

            <WorkOrderGrid rows={pagedRows} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />

            <GridPaginationBar
                pageIndex={currentPage}
                pageSize={pageSize}
                totalCount={filteredRows.length}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
            />

            <WorkOrderFormDialog
                open={formOpen}
                mode={editingRow ? 'edit' : 'create'}
                initialValue={editingRow ?? undefined}
                onClose={handleCloseForm}
                onSubmit={handleSubmit}
            />

            <ConfirmDialog
                open={deleteTarget !== null}
                title="작업지시 삭제"
                description={`'${deleteTarget?.itemName ?? ''}' 작업지시를 삭제하시겠습니까?`}
                confirmText="삭제"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </Stack>
    );
}