import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import {
    createEquipment,
    deleteEquipment,
    listEquipmentPaged,
    restoreEquipment,
    updateEquipment,
    type EquipmentItem,
} from '../../../services/basicinfo/equipmentService';
import {
  EquipmentSearchBar,
  type EquipmentSearchValue,
} from './components/EquipmentSearchBar';
import { EquipmentGrid } from './components/EquipmentGrid';
import {
  EquipmentFormDialog,
  type EquipmentFormValue,
} from './components/EquipmentFormDialog';

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<EquipmentSearchValue>({
    keyword: '',
    filterActive: 'all',
  });
  const [appliedSearch, setAppliedSearch] = useState<EquipmentSearchValue>({
    keyword: '',
    filterActive: 'all',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<EquipmentItem | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<EquipmentItem | null>(null);

  const equipmentQuery = useQuery({
    queryKey: [
      'basicinfo-equipment',
      tenantCode || 'self',
      pageIndex,
      pageSize,
      appliedSearch.keyword,
      appliedSearch.filterActive,
    ],
    queryFn: () =>
      listEquipmentPaged({
        tenantCode: tenantCode || undefined,
        pageIndex,
        pageSize,
        keyword: appliedSearch.keyword || undefined,
        filterActive: appliedSearch.filterActive,
      }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      setFormOpen(false);
      setEditingEquipment(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-equipment', tenantCode || 'self'],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      setFormOpen(false);
      setEditingEquipment(null);
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-equipment', tenantCode || 'self'],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      setDeleteTarget(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-equipment', tenantCode || 'self'],
      });
    },
  });

    const restoreMutation = useMutation({
        mutationFn: restoreEquipment,
        onSuccess: () => {
            setRestoreTarget(null);
            void queryClient.invalidateQueries({
                queryKey: ['basicinfo-equipment', tenantCode || 'self'],
            });
        },
    });

  const handleSearch = () => {
    resetPage();
    setAppliedSearch({
      keyword: searchValue.keyword.trim(),
      filterActive: searchValue.filterActive,
    });
  };

  const handleOpenCreate = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (equipment: EquipmentItem) => {
    setEditingEquipment(equipment);
    setFormOpen(true);
  };

  const handleSubmitForm = (value: EquipmentFormValue) => {
    const payload = {
      tenantCode: tenantCode || undefined,
      ...value,
      vcCycle: value.vcCycle ? Number(value.vcCycle) : null,
    };

    if (editingEquipment) {
      updateMutation.mutate({
        id: editingEquipment.id,
        ...payload,
      });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteMutation.mutate({
      tenantCode: tenantCode || undefined,
      id: deleteTarget.id,
    });
  };

    const handleConfirmRestore = () => {
        if (!restoreTarget) {
            return;
        }
        restoreMutation.mutate({
            tenantCode: tenantCode || undefined,
            id: restoreTarget.id,
        });
    };

  return (
    <Stack spacing={2} data-testid="basicinfo-equipment-page">
      <PageHeader
        groupLabel="기준정보 관리"
        title="설비관리"
        description="생산/보관 설비 기준정보를 관리합니다."
      />

      {equipmentQuery.isError ? (
        <Alert severity="warning">설비 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <EquipmentSearchBar
        value={searchValue}
        disabled={equipmentQuery.isLoading}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onCreate={handleOpenCreate}
      />

        <EquipmentGrid
            rows={equipmentQuery.data?.items ?? []}
            loading={equipmentQuery.isLoading}
            onEdit={handleOpenEdit}
            onDelete={(equipment) => setDeleteTarget(equipment)}
            onRestore={(equipment) => setRestoreTarget(equipment)}
        />

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={equipmentQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <EquipmentFormDialog
        open={formOpen}
        mode={editingEquipment ? 'edit' : 'create'}
        saving={createMutation.isPending || updateMutation.isPending}
        equipSysCd={editingEquipment?.equipSysCd}
        initialValue={
          editingEquipment
            ? {
                equipCd: editingEquipment.equipCd,
                equipNm: editingEquipment.equipNm,
                equipKind: editingEquipment.equipKind,
                purDate: editingEquipment.purDate,
                purCust: editingEquipment.purCust,
                makCust: editingEquipment.makCust,
                equipSpec: editingEquipment.equipSpec,
                location: editingEquipment.location,
                vcKind: editingEquipment.vcKind,
                vcCycle:
                    editingEquipment.vcCycle !== null
                        ? String(editingEquipment.vcCycle)
                        : '',
                bigo: editingEquipment.bigo,
                active: editingEquipment.active,
              }
            : undefined
        }
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) {
            return;
          }
          setFormOpen(false);
          setEditingEquipment(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="설비 삭제"
        description={
            deleteTarget
                ? `'${deleteTarget.equipNm}' 미사용으로 처리하시겠습니까?`
                : '설비를 삭제하시겠습니까?'
        }
        confirmText="미사용"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onClose={() => {
          if (deleteMutation.isPending) {
            return;
          }
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

        <ConfirmDialog
            open={Boolean(restoreTarget)}
            title="설비 다시 사용"
            description={
                restoreTarget
                    ? `'${restoreTarget.equipNm}' 설비를 다시 사용하시겠습니까?`
                    : '설비를 다시 사용하시겠습니까?'
            }
            confirmText="사용"
            confirmColor="primary"
            loading={restoreMutation.isPending}
            onClose={() => {
                if (restoreMutation.isPending) {
                    return;
                }
                setRestoreTarget(null);
            }}
            onConfirm={handleConfirmRestore}
        />
    </Stack>
  );
}
