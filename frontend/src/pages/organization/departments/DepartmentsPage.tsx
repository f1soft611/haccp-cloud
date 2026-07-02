import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { useAuthStore } from '../../../shared/store/authStore';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type DepartmentFormData,
  type DepartmentItem,
} from '../../../services/organization/departmentsService';
import { APP_LABELS } from '../../../shared/constants/labels';
import {
  DepartmentSearchBar,
  type DepartmentSearchValue,
} from './components/DepartmentSearchBar';
import {
  DepartmentTreeGrid,
  type DepartmentTreeRow,
} from './components/DepartmentTreeGrid';
import { DepartmentFormModal } from './components/DepartmentFormModal';

const DEFAULT_FORM: DepartmentFormData = {
  name: '',
  parentId: null,
  sortOrder: 0,
  active: true,
};

const DEFAULT_SEARCH: DepartmentSearchValue = {
  searchKeyword: '',
  filterActive: 'all',
};

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const { showError, showSuccess } = useFeedback();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] =
    useState<DepartmentSearchValue>(DEFAULT_SEARCH);
  const [appliedFilters, setAppliedFilters] =
    useState<DepartmentSearchValue>(DEFAULT_SEARCH);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DepartmentItem | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(DEFAULT_FORM);
  const [confirmState, setConfirmState] = useState<{
    type: 'save' | 'delete';
    title: string;
    description: string;
    confirmText: string;
    confirmColor: 'primary' | 'error';
    targetId?: string;
  } | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ['departments', tenantCode, appliedFilters],
    queryFn: () =>
      listDepartments({
        tenantCode,
        name: appliedFilters.searchKeyword || undefined,
        active:
          appliedFilters.filterActive !== 'all'
            ? (appliedFilters.filterActive as 'Y' | 'N')
            : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('부서가 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['departments', tenantCode],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '부서 등록에 실패했습니다.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('부서가 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['departments', tenantCode],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '부서 수정에 실패했습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      setConfirmState(null);
      showSuccess('부서가 삭제되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['departments', tenantCode],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '부서 삭제에 실패했습니다.'));
    },
  });

  const allDepts = departmentsQuery.data ?? [];

  const childrenByParent = useMemo(() => {
    const map = new Map<string, DepartmentItem[]>();
    allDepts.forEach((d) => {
      if (d.parentId) {
        const list = map.get(d.parentId) ?? [];
        list.push(d);
        map.set(d.parentId, list);
      }
    });
    return map;
  }, [allDepts]);

  const rootDepts = useMemo(
    () => allDepts.filter((d) => d.parentId === null),
    [allDepts],
  );

  const totalCount = rootDepts.length;
  const pagedRoots = useMemo(
    () => rootDepts.slice((pageIndex - 1) * pageSize, pageIndex * pageSize),
    [rootDepts, pageIndex, pageSize],
  );

  const gridRows = useMemo<DepartmentTreeRow[]>(
    () =>
      pagedRoots.map((dept) => ({
        dept,
        children: childrenByParent.get(dept.id) ?? [],
      })),
    [pagedRoots, childrenByParent],
  );

  // 상위 부서 선택 옵션: 현재 수정 대상 제외한 루트 부서만
  const parentOptions = useMemo(
    () =>
      allDepts.filter(
        (d) => d.parentId === null && (!editTarget || d.id !== editTarget.id),
      ),
    [allDepts, editTarget],
  );

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditTarget(null);
  };

  const handleOpenEditModal = (dept: DepartmentItem) => {
    setEditTarget(dept);
    setFormData({
      name: dept.name,
      parentId: dept.parentId,
      sortOrder: dept.sortOrder,
      active: dept.active,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    setConfirmState({
      type: 'save',
      title: editTarget ? '부서 수정 확인' : '부서 등록 확인',
      description: editTarget
        ? '수정한 부서 정보를 저장하시겠습니까?'
        : '입력한 부서 정보를 등록하시겠습니까?',
      confirmText: editTarget ? '저장' : '등록',
      confirmColor: 'primary',
    });
  };

  const executeSave = () => {
    if (editTarget) {
      updateMutation.mutate({
        tenantCode,
        id: editTarget.id,
        name: formData.name,
        parentId: formData.parentId,
        sortOrder: formData.sortOrder,
        active: formData.active,
      });
      return;
    }
    createMutation.mutate({
      tenantCode,
      name: formData.name,
      parentId: formData.parentId,
      sortOrder: formData.sortOrder,
    });
  };

  const handleDelete = (dept: DepartmentItem) => {
    setConfirmState({
      type: 'delete',
      title: '부서 삭제 확인',
      description: `'${dept.name}' 부서를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      confirmColor: 'error',
      targetId: dept.id,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;
    if (confirmState.type === 'delete' && confirmState.targetId) {
      deleteMutation.mutate({ tenantCode, id: confirmState.targetId });
      return;
    }
    executeSave();
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Stack spacing={2}>
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.departments}
        description="부서를 등록하고 계층 구조를 관리합니다."
      />

      {departmentsQuery.isError ? (
        <Alert severity="error">부서 목록을 불러올 수 없습니다.</Alert>
      ) : null}

      <DepartmentSearchBar
        value={searchValue}
        loading={departmentsQuery.isLoading}
        onChange={setSearchValue}
        onSearch={() => {
          resetPage();
          setAppliedFilters({ ...searchValue });
        }}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
      />

      <DepartmentTreeGrid
        rows={gridRows}
        loading={departmentsQuery.isLoading}
        deletePending={deleteMutation.isPending}
        expandedIds={expandedIds}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onToggleExpand={toggleExpanded}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <DepartmentFormModal
        open={modalOpen}
        isEdit={Boolean(editTarget)}
        formData={formData}
        parentOptions={parentOptions}
        editTargetId={editTarget?.id}
        submitting={isMutating}
        onClose={() => setModalOpen(false)}
        onChange={setFormData}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmText={confirmState?.confirmText ?? '확인'}
        confirmColor={confirmState?.confirmColor ?? 'primary'}
        loading={isMutating}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmState(null)}
      />
    </Stack>
  );
}
