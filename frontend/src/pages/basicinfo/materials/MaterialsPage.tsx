import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createMaterial,
  deleteMaterial,
  listMaterialsPaged,
  restoreMaterial,
  updateMaterial,
  type MaterialItem,
} from '../../../services/basicinfo/materialsService';
import {
  MaterialsSearchBar,
  type MaterialsSearchValue,
} from './components/MaterialsSearchBar';
import { MaterialsGrid } from './components/MaterialsGrid';
import {
  MaterialFormDialog,
  type MaterialFormValue,
} from './components/MaterialFormDialog';

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<MaterialsSearchValue>({
    keyword: '',
    itemType: '',
    filterActive: '',
  });
  const [appliedSearch, setAppliedSearch] = useState<MaterialsSearchValue>({
    keyword: '',
    itemType: '',
    filterActive: '',
  });
  const [searchSeq, setSearchSeq] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<MaterialItem | null>(null);

  const materialsQuery = useQuery({
    queryKey: [
      'basicinfo-materials',
      tenantCode || 'self',
      pageIndex,
      pageSize,
      appliedSearch.keyword,
      appliedSearch.itemType,
      appliedSearch.filterActive,
      searchSeq,
    ],
    queryFn: () =>
        listMaterialsPaged({
          tenantCode: tenantCode || undefined,
          pageIndex,
          pageSize,
          keyword: appliedSearch.keyword || undefined,
          itemTypes: appliedSearch.itemType ? [appliedSearch.itemType] : undefined,
          filterActive: appliedSearch.filterActive,
        }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      setFormOpen(false);
      setEditingMaterial(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-materials', tenantCode || 'self'],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMaterial,
    onSuccess: () => {
      setFormOpen(false);
      setEditingMaterial(null);
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-materials', tenantCode || 'self'],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-materials', tenantCode || 'self'],
      });
    },
  });

  // 비활성 품목 다시 활성화
  const restoreMutation = useMutation({
    mutationFn: restoreMaterial,
    onSuccess: () => {
      setRestoreTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-materials', tenantCode || 'self'],
      });
    },
  });

  const handleSearch = () => {
    resetPage();
    setAppliedSearch({
      keyword: searchValue.keyword.trim(),
      itemType: searchValue.itemType,
      filterActive: searchValue.filterActive,
    });
    setSearchSeq((n) => n + 1);
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (material: MaterialItem) => {
    setEditingMaterial(material);
    setFormOpen(true);
  };

  const handleSubmitForm = (value: MaterialFormValue) => {
    const payload = {
      tenantCode: tenantCode || undefined,
      materialName: value.materialName,
      itemType: value.itemType || undefined,
      materialSpec: value.materialSpec || undefined,
      materialWeight:
          value.materialWeight.trim().length > 0
              ? Number(value.materialWeight)
              : null,
      unit: value.unit || undefined,
      materialKind: value.materialKind || undefined,
      storeMethod: value.storeMethod || undefined,
      expiryedStatus: value.expiryedStatus,
      expiryedCount:
          value.expiryedStatus !== 'NONE' ? Number(value.expiryedCount) : null,
      kfdaReportNo: value.kfdaReportNo || undefined,
      etc: value.etc || undefined,
    };

    if (editingMaterial) {
      updateMutation.mutate({
        id: editingMaterial.id,
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

  // 활성화 확인 시 복구 API 호출
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
    <Stack spacing={2} data-testid="basicinfo-materials-page">
      <PageHeader
        groupLabel="기준정보 관리"
        title="품목 관리"
        description="제품/상품/원재료 등 품목 기준정보를 관리합니다."
      />

      {materialsQuery.isError ? (
        <Alert severity="warning">품목 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <MaterialsSearchBar
        value={searchValue}
        disabled={materialsQuery.isLoading}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onCreate={handleOpenCreate}
      />

      <MaterialsGrid
        rows={materialsQuery.data?.items ?? []}
        loading={materialsQuery.isLoading}
        onEdit={handleOpenEdit}
        onDelete={(material) => setDeleteTarget(material)}
        onRestore={(material) => setRestoreTarget(material)}
      />

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={materialsQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <MaterialFormDialog
        open={formOpen}
        mode={editingMaterial ? 'edit' : 'create'}
        saving={createMutation.isPending || updateMutation.isPending}
        materialCode={editingMaterial?.materialCode}
        initialValue={
          editingMaterial
            ? {
                materialName: editingMaterial.materialName,
                itemType: editingMaterial.itemType,
                materialSpec: editingMaterial.materialSpec,
                materialWeight:
                  editingMaterial.materialWeight !== null
                    ? String(editingMaterial.materialWeight)
                    : '',
                unit: editingMaterial.unit,
                materialKind: editingMaterial.materialKind,
                storeMethod: editingMaterial.storeMethod,
                expiryedStatus: editingMaterial.expiryedStatus,
                expiryedCount:
                    editingMaterial.expiryedCount !== null
                        ? String(editingMaterial.expiryedCount)
                        : '',
                kfdaReportNo: editingMaterial.kfdaReportNo,
                etc: editingMaterial.etc,
              }
            : undefined
        }
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) {
            return;
          }
          setFormOpen(false);
          setEditingMaterial(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="품목 비활성화"
        description={
          deleteTarget
            ? `'${deleteTarget.materialName}' 품목을 비활성화하시겠습니까?`
            : '품목을 비활성화하시겠습니까?'
        }
        confirmText="비활성화"
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
        title="품목 활성화"
        description={
          restoreTarget
            ? `'${restoreTarget.materialName}' 품목을 활성화하시겠습니까?`
            : '품목을 활성화하시겠습니까?'
        }
        confirmText="활성화"
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
