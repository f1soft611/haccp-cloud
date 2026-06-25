import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
  listPlatformMenus,
  type PlatformMenuItem,
} from '../../../services/platform/platformMenuService';
import {
  createPlatformRole,
  listPlatformRolesPaged,
  updatePlatformRole,
  updatePlatformRoleStatus,
  type PlatformRoleItem,
} from '../../../services/platform/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  savePlatformRoleMenuMapping,
} from '../../../services/platform/platformRoleMenuService';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  PlatformAuthorityFormDialog,
  type PlatformAuthorityFormValue,
} from './components/PlatformAuthorityFormDialog';
import { PlatformAuthorityGrid } from './components/PlatformAuthorityGrid';
import { PlatformAuthorityMenuMappingDialog } from './components/PlatformAuthorityMenuMappingDialog';
import {
  PlatformAuthoritySearchBar,
  type AuthoritySearchValue,
} from './components/PlatformAuthoritySearchBar';

export function PlatformAuthorityManagementPage() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();
  const tenantCode = useAuthStore((state) => state.tenantCode);

  const [searchValue, setSearchValue] = useState<AuthoritySearchValue>({
    searchField: 'name',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState<AuthoritySearchValue>({
    searchField: 'name',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [formData, setFormData] = useState<PlatformAuthorityFormValue>({
    code: '',
    name: '',
    description: '',
    useAt: 'Y',
  });
  const [selectedRole, setSelectedRole] = useState<PlatformRoleItem | null>(
    null,
  );
  const [editTargetRole, setEditTargetRole] = useState<PlatformRoleItem | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState<PlatformAuthorityFormValue>({
    code: '',
    name: '',
    description: '',
    useAt: 'Y',
  });
  const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
    color?: 'primary' | 'error' | 'warning';
  } | null>(null);

  const rolesQuery = useQuery({
    queryKey: [
      'platform-admin',
      'roles-paged',
      pageIndex,
      pageSize,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.filterActive,
    ],
    queryFn: () =>
      listPlatformRolesPaged({
        pageIndex,
        pageSize,
        searchField: appliedFilters.searchField,
        searchKeyword: appliedFilters.searchKeyword || undefined,
        useAt: appliedFilters.filterActive,
      }),
    retry: false,
  });

  const menusQuery = useQuery<PlatformMenuItem[]>({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
    retry: false,
  });

  const effectiveRoleCode = selectedRole?.code ?? '';

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode, tenantCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode),
    enabled: mappingModalOpen && effectiveRoleCode.length > 0,
    retry: false,
  });

  const filteredRoles = useMemo(
    () => rolesQuery.data?.items ?? [],
    [rolesQuery.data?.items],
  );

  const selectedMenuIds = useMemo(
    () => draftMenuIds ?? mappingQuery.data?.menuIds ?? [],
    [draftMenuIds, mappingQuery.data?.menuIds],
  );

  const currentPageMenu = useMemo(
    () =>
      (menusQuery.data ?? []).find(
        (menu) => menu.menuUrl.trim().toLowerCase() === '/platform/roles',
      ),
    [menusQuery.data],
  );

  const pageTitle =
    currentPageMenu?.menuNm ?? APP_LABELS.pageTitle.platformRoleManagement;

  const pageDescription =
    currentPageMenu?.menuDc ||
    '권한 등록, 상태 관리, 권한별 메뉴 매핑을 한 화면에서 처리합니다.';

  const createMutation = useMutation({
    mutationFn: createPlatformRole,
    onSuccess: () => {
      setFormData({ code: '', name: '', description: '', useAt: 'Y' });
      setCreateModalOpen(false);
      setConfirmState(null);
      showSuccess('권한이 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles', tenantCode],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 등록 처리에 실패했습니다.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: updatePlatformRoleStatus,
    onSuccess: () => {
      setConfirmState(null);
      showSuccess('권한 상태가 변경되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles', tenantCode],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 상태 변경에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePlatformRole,
    onSuccess: () => {
      setEditModalOpen(false);
      setEditTargetRole(null);
      setConfirmState(null);
      showSuccess('권한이 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles', tenantCode],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 수정 처리에 실패했습니다.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: savePlatformRoleMenuMapping,
    onSuccess: (_, payload) => {
      setDraftMenuIds(null);
      setMappingModalOpen(false);
      setSelectedRole(null);
      setConfirmState(null);
      showSuccess('권한별 메뉴 매핑이 저장되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: [
          'platform-admin',
          'role-menus',
          payload.roleCode,
          payload.tenantCode ?? tenantCode,
        ],
      });
    },
    onError: () => {
      showError('권한별 메뉴 저장에 실패했습니다.');
    },
  });

  const handleSearch = () => {
    resetPage();
    setAppliedFilters({
      ...searchValue,
      searchKeyword: searchValue.searchKeyword.trim(),
    });
  };

  const handleOpenCreateModal = () => {
    setFormData({ code: '', name: '', description: '', useAt: 'Y' });
    setCreateModalOpen(true);
    setEditModalOpen(false);
    setEditTargetRole(null);
  };

  const handleOpenEditModal = (role: PlatformRoleItem) => {
    setEditTargetRole(role);
    setEditFormData({
      code: role.code,
      name: role.name,
      description: role.description,
      useAt: role.active ? 'Y' : 'N',
    });
    setEditModalOpen(true);
    setCreateModalOpen(false);
  };

  const handleToggleActive = (role: PlatformRoleItem) => {
    setConfirmState({
      title: role.active ? '권한 비활성화 확인' : '권한 활성화 확인',
      description: `'${role.name}' 권한의 상태를 변경하시겠습니까?`,
      confirmText: role.active ? '비활성화' : '활성화',
      action: () => {
        statusMutation.mutate({
          id: role.id,
          code: role.code,
          active: !role.active,
        });
      },
      color: role.active ? 'warning' : 'primary',
    });
  };

  const handleOpenMappingModal = (role: PlatformRoleItem) => {
    setSelectedRole(role);
    setDraftMenuIds(null);
    setMappingModalOpen(true);
  };

  const handleCloseMappingModal = () => {
    setMappingModalOpen(false);
    setSelectedRole(null);
    setDraftMenuIds(null);
  };

  const handleCreate = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }

    setConfirmState({
      title: '권한 등록 확인',
      description: '입력한 권한 정보를 등록하시겠습니까?',
      confirmText: '등록',
      action: () => {
        createMutation.mutate({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          active: formData.useAt === 'Y',
        });
      },
    });
  };

  const handleUpdate = () => {
    if (!editTargetRole || !editFormData.name.trim()) {
      return;
    }

    setConfirmState({
      title: '권한 수정 확인',
      description: `'${editTargetRole.code}' 권한 정보를 저장하시겠습니까?`,
      confirmText: '저장',
      action: () => {
        updateMutation.mutate({
          id: editTargetRole.id,
          code: editTargetRole.code,
          name: editFormData.name.trim(),
          description: editFormData.description.trim(),
          active: editFormData.useAt === 'Y',
        });
      },
    });
  };

  const handleSaveMapping = () => {
    if (!selectedRole || !effectiveRoleCode) {
      return;
    }

    setConfirmState({
      title: '메뉴 매핑 저장 확인',
      description: `'${selectedRole.name}' 권한의 메뉴 매핑을 저장하시겠습니까?`,
      confirmText: '저장',
      action: () => {
        saveMutation.mutate({
          roleCode: effectiveRoleCode,
          menuIds: selectedMenuIds,
        });
      },
    });
  };

  const rolesErrorMessage = rolesQuery.isError
    ? extractApiErrorMessage(
        rolesQuery.error,
        '권한 목록을 불러올 수 없습니다.',
      )
    : null;

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    statusMutation.isPending ||
    saveMutation.isPending;

  const formDialogOpen = createModalOpen || editModalOpen;
  const formDialogMode: 'create' | 'edit' = createModalOpen ? 'create' : 'edit';
  const formDialogValue = createModalOpen ? formData : editFormData;

  return (
    <Stack spacing={2} data-testid="platform-authority-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={pageTitle}
        description={pageDescription}
      />

      {createMutation.isError ? (
        <Alert severity="warning">권한 등록 처리에 실패했습니다.</Alert>
      ) : null}
      {statusMutation.isError ? (
        <Alert severity="warning">권한 상태 변경에 실패했습니다.</Alert>
      ) : null}
      {updateMutation.isError ? (
        <Alert severity="warning">권한 수정 처리에 실패했습니다.</Alert>
      ) : null}
      {saveMutation.isSuccess ? (
        <Alert severity="success">권한별 메뉴 매핑이 저장되었습니다.</Alert>
      ) : null}
      {saveMutation.isError ? (
        <Alert severity="warning">권한별 메뉴 저장에 실패했습니다.</Alert>
      ) : null}
      {rolesErrorMessage ? (
        <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
          {rolesErrorMessage}
        </Alert>
      ) : null}

      <PlatformAuthoritySearchBar
        value={searchValue}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onCreate={handleOpenCreateModal}
      />

      <PlatformAuthorityGrid
        rows={filteredRoles}
        loading={rolesQuery.isLoading}
        onMenuMapping={handleOpenMappingModal}
        onEdit={handleOpenEditModal}
        onToggleActive={handleToggleActive}
      />

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={rolesQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <PlatformAuthorityFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        value={formDialogValue}
        saving={createMutation.isPending || updateMutation.isPending}
        onChange={(next) => {
          if (formDialogMode === 'create') {
            setFormData(next);
            return;
          }

          setEditFormData(next);
        }}
        onSubmit={formDialogMode === 'create' ? handleCreate : handleUpdate}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setEditTargetRole(null);
        }}
      />

      <PlatformAuthorityMenuMappingDialog
        open={mappingModalOpen}
        role={selectedRole}
        menus={menusQuery.data ?? []}
        selectedMenuIds={selectedMenuIds}
        loading={mappingQuery.isLoading || menusQuery.isLoading}
        saving={saveMutation.isPending}
        error={mappingQuery.isError}
        onChangeSelected={setDraftMenuIds}
        onSave={handleSaveMapping}
        onClose={handleCloseMappingModal}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmText={confirmState?.confirmText ?? '확인'}
        confirmColor={confirmState?.color ?? 'primary'}
        loading={isBusy}
        onConfirm={() => confirmState?.action()}
        onClose={() => setConfirmState(null)}
      />
    </Stack>
  );
}
