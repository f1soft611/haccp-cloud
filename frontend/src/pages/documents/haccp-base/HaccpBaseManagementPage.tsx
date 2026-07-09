import { Alert, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useAuthStore } from '../../../shared/store/authStore';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import {
  listHaccpBaseCategories,
  type HaccpBaseCategoryItem,
} from '../../../services/documents/haccpBaseCategoryService';
import {
  createHaccpBaseWork,
  listHaccpBaseWorks,
  updateHaccpBaseWork,
  type HaccpBaseWorkItem,
} from '../../../services/documents/haccpBaseWorkService';
import { listUsers } from '../../../services/organization/usersService';
import { HaccpBaseCreateDialog } from './components/HaccpBaseCreateDialog';
import { HaccpBaseGrid } from './components/HaccpBaseGrid';
import {
  HaccpBaseSearchBar,
  type HaccpBaseSearchValue,
} from './components/HaccpBaseSearchBar';
import type {
  HaccpBaseCreateForm,
  HaccpBaseRow,
  HaccpCategoryOption,
  HaccpCycle,
} from './types';

const DEFAULT_SEARCH_VALUE: HaccpBaseSearchValue = {
  categoryId: 'ALL',
  keyword: '',
};

const DEFAULT_CREATE_FORM: HaccpBaseCreateForm = {
  divisionCode: '',
  divisionName: '',
  categoryId: '',
  cycle: '일',
  reviewerId: '',
  approverId: '',
  assigneeIds: [],
  useAt: 'Y',
};

function toCycle(cycle: string): HaccpCycle {
  if (
    cycle === '일' ||
    cycle === '주' ||
    cycle === '월' ||
    cycle === '발생시'
  ) {
    return cycle;
  }
  return '일';
}

function toCategoryOption(item: HaccpBaseCategoryItem): HaccpCategoryOption {
  return {
    id: item.id,
    code: item.categoryCode,
    name: item.categoryName,
  };
}

function toRow(item: HaccpBaseWorkItem, index: number): HaccpBaseRow {
  return {
    id: item.id,
    no: index + 1,
    divisionCode: item.divisionCode,
    divisionName: item.divisionName,
    categoryId: item.categoryGroupId,
    categoryName: item.categoryName,
    cycle: toCycle(item.cycle),
    createdBy: item.createdBy || '-',
    createdAt: item.createdAt || '-',
    owner: item.owner || '-',
    assigneeSummary: item.assigneeSummary || '-',
    assigneeIds: item.assigneeIds ?? [],
    reviewerId: item.reviewerId || '',
    reviewerName: item.reviewerName || '-',
    approverId: item.approverId || '',
    approverName: item.approverName || '-',
    assigneeMapped: item.assigneeMapped,
    hasDocument: item.hasDocument,
    useAt: item.active ? 'Y' : 'N',
  };
}

export function HaccpBaseManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');
  const { showError, showSuccess } = useFeedback();

  const [searchValue, setSearchValue] =
    useState<HaccpBaseSearchValue>(DEFAULT_SEARCH_VALUE);
  const [appliedFilters, setAppliedFilters] =
    useState<HaccpBaseSearchValue>(DEFAULT_SEARCH_VALUE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [createForm, setCreateForm] =
    useState<HaccpBaseCreateForm>(DEFAULT_CREATE_FORM);
  const [editForm, setEditForm] =
    useState<HaccpBaseCreateForm>(DEFAULT_CREATE_FORM);

  const categoriesQuery = useQuery({
    queryKey: ['haccp-base-categories', tenantCode],
    queryFn: () => listHaccpBaseCategories({ tenantCode }),
    retry: false,
  });

  const worksQuery = useQuery({
    queryKey: ['haccp-base-works', tenantCode],
    queryFn: () => listHaccpBaseWorks({ tenantCode }),
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ['users', tenantCode, 'haccp-base-management'],
    queryFn: () => listUsers(tenantCode),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createHaccpBaseWork,
    onSuccess: () => {
      setCreateForm(DEFAULT_CREATE_FORM);
      setCreateOpen(false);
      showSuccess('업무가 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['haccp-base-works', tenantCode],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '업무 등록에 실패했습니다.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateHaccpBaseWork,
    onSuccess: () => {
      setEditOpen(false);
      setEditTargetId(null);
      setEditForm(DEFAULT_CREATE_FORM);
      showSuccess('업무가 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['haccp-base-works', tenantCode],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '업무 수정에 실패했습니다.'));
    },
  });

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .filter((item) => item.active)
        .map(toCategoryOption),
    [categoriesQuery.data],
  );

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    const rows = (worksQuery.data ?? []).map(toRow);

    return rows.filter((row) => {
      const byCategory =
        appliedFilters.categoryId === 'ALL' ||
        row.categoryId === appliedFilters.categoryId;

      if (!byCategory) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        row.divisionName.toLowerCase().includes(keyword) ||
        row.owner.toLowerCase().includes(keyword)
      );
    });
  }, [appliedFilters, worksQuery.data]);

  const activeUsers = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.active),
    [usersQuery.data],
  );

  const handleCreate = () => {
    if (
      !createForm.categoryId ||
      !createForm.divisionCode.trim() ||
      !createForm.divisionName.trim() ||
      !createForm.reviewerId ||
      !createForm.approverId
    ) {
      return;
    }

    createMutation.mutate({
      tenantCode,
      categoryGroupId: createForm.categoryId,
      divisionCode: createForm.divisionCode.trim(),
      divisionName: createForm.divisionName.trim(),
      cycle: createForm.cycle,
      active: createForm.useAt === 'Y',
      reviewerId: createForm.reviewerId,
      approverId: createForm.approverId,
      assigneeIds: createForm.assigneeIds,
    });
  };

  const handleOpenEdit = (row: HaccpBaseRow) => {
    setEditTargetId(row.id);
    setEditForm({
      categoryId: row.categoryId,
      divisionCode: row.divisionCode,
      divisionName: row.divisionName,
      cycle: row.cycle,
      reviewerId: row.reviewerId,
      approverId: row.approverId,
      assigneeIds: row.assigneeIds,
      useAt: row.useAt,
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (
      !editTargetId ||
      !editForm.categoryId ||
      !editForm.divisionName.trim() ||
      !editForm.reviewerId ||
      !editForm.approverId
    ) {
      return;
    }

    updateMutation.mutate({
      tenantCode,
      id: editTargetId,
      categoryGroupId: editForm.categoryId,
      divisionCode: editForm.divisionCode.trim(),
      divisionName: editForm.divisionName.trim(),
      cycle: editForm.cycle,
      active: editForm.useAt === 'Y',
      reviewerId: editForm.reviewerId,
      approverId: editForm.approverId,
      assigneeIds: editForm.assigneeIds,
    });
  };

  return (
    <Stack spacing={2} data-testid="haccp-base-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 양식관리"
        description="양식 기준정보를 조회하고 담당자/문서 편집 화면으로 이동해 상세 작업을 진행합니다."
      />

      {categoriesQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            categoriesQuery.error,
            '분류 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      {worksQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            worksQuery.error,
            '업무 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      {usersQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            usersQuery.error,
            '사용자 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <HaccpBaseSearchBar
        value={searchValue}
        categoryOptions={categoryOptions}
        onChange={setSearchValue}
        onSearch={() => {
          setAppliedFilters({
            ...searchValue,
            keyword: searchValue.keyword.trim(),
          });
        }}
        onCreate={() => {
          setCreateForm({
            ...DEFAULT_CREATE_FORM,
            categoryId: categoryOptions[0]?.id ?? '',
            reviewerId: '',
            approverId: '',
          });
          setCreateOpen(true);
        }}
        onCategorySettings={() => navigate('/docs/haccp-base/categories')}
      />

      <HaccpBaseGrid
        rows={filteredRows}
        onEdit={handleOpenEdit}
        onOpenEditorPage={(rowId) =>
          navigate(`/docs/haccp-base/editor/${rowId}`)
        }
      />

      <HaccpBaseCreateDialog
        open={createOpen}
        mode="create"
        categoryOptions={categoryOptions}
        userOptions={activeUsers}
        value={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      <HaccpBaseCreateDialog
        open={editOpen}
        mode="edit"
        categoryOptions={categoryOptions}
        userOptions={activeUsers}
        value={editForm}
        onChange={setEditForm}
        onSubmit={handleEdit}
        onClose={() => {
          setEditOpen(false);
          setEditTargetId(null);
        }}
      />
    </Stack>
  );
}
