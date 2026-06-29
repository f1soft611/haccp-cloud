import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { getCurrentPlanAccess } from '../../../services/platform-admin/planAccessService';
import {
  isFeatureAllowed,
  resolveFeatureCodeByButton,
} from '../../../services/platform-admin/featureCatalog';
import {
  createPlatformMenu,
  deletePlatformMenu,
  listPlatformMenusPaged,
  listPlatformMenus,
  updatePlatformMenu,
  type PlatformMenuItem,
} from '../../../services/platform-admin/platformMenuService';
import {
  MenuSearchBar,
  type MenuSearchValue,
} from './components/MenuSearchBar';
import { MenuGrid, type MenuTreeRow } from './components/MenuGrid';
import { MenuFormDialog, type MenuFormData } from './components/MenuFormDialog';

function normalizeParentMenuId(
  parentMenuId: string | null | undefined,
): string | null {
  if (parentMenuId == null) return null;
  const trimmed = parentMenuId.trim();
  return trimmed === '' ? null : trimmed;
}

const DEFAULT_FORM: MenuFormData = {
  menuCode: '',
  menuNm: '',
  menuDc: '',
  menuUrl: '',
  parentMenuId: null,
  menuOrdr: 0,
  iconNm: 'Menu',
  useAt: 'Y',
};

export function PlatformMenuManagementPage() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<MenuSearchValue>({
    searchField: 'menuNm',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState<MenuSearchValue>({
    searchField: 'menuNm',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(DEFAULT_FORM);
  const [confirmState, setConfirmState] = useState<{
    type: 'save' | 'delete';
    title: string;
    description: string;
    confirmText: string;
    confirmColor: 'primary' | 'error';
    targetMenuId?: string;
  } | null>(null);

  const fullMenusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const menusQuery = useQuery({
    queryKey: [
      'platform-admin',
      'menus-paged',
      pageIndex,
      pageSize,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.filterActive,
    ],
    queryFn: () =>
      listPlatformMenusPaged({
        pageIndex,
        pageSize,
        searchField: appliedFilters.searchField as
          | 'menuNm'
          | 'menuDc'
          | 'menuUrl',
        searchKeyword: appliedFilters.searchKeyword || undefined,
        useAt: appliedFilters.filterActive as 'Y' | 'N' | 'all',
      }),
  });

  const planAccessQuery = useQuery({
    queryKey: ['current-plan-access'],
    queryFn: getCurrentPlanAccess,
    retry: false,
  });

  const canManageMenus = isFeatureAllowed(
    planAccessQuery.data?.features,
    resolveFeatureCodeByButton('platform-menu-create'),
  );

  const createMutation = useMutation({
    mutationFn: createPlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('메뉴가 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 등록에 실패했습니다.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('메뉴가 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 수정에 실패했습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlatformMenu,
    onSuccess: () => {
      setConfirmState(null);
      showSuccess('메뉴가 삭제되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 삭제에 실패했습니다.'));
    },
  });

  const pageMenus = useMemo(() => {
    return (menusQuery.data?.items ?? []).map((menu) => ({
      ...menu,
      parentMenuId: normalizeParentMenuId(menu.parentMenuId),
    }));
  }, [menusQuery.data?.items]);

  const pageMenuIdSet = useMemo(
    () => new Set(pageMenus.map((m) => m.menuId)),
    [pageMenus],
  );

  const fullMenuNameById = useMemo(
    () => new Map((fullMenusQuery.data ?? []).map((m) => [m.menuId, m.menuNm])),
    [fullMenusQuery.data],
  );

  const gridRows = useMemo<MenuTreeRow[]>(() => {
    const rootMenus = pageMenus.filter(
      (m) => normalizeParentMenuId(m.parentMenuId) === null,
    );
    const orphanChildren = pageMenus.filter((m) => {
      const parentId = normalizeParentMenuId(m.parentMenuId);
      return parentId !== null && !pageMenuIdSet.has(parentId);
    });
    const visibleMenus =
      rootMenus.length === 0 ? pageMenus : [...rootMenus, ...orphanChildren];

    return visibleMenus.map((rootMenu) => {
      const parentId = normalizeParentMenuId(rootMenu.parentMenuId);
      const isOrphan = parentId !== null && !pageMenuIdSet.has(parentId);
      return {
        menu: rootMenu,
        children: pageMenus.filter(
          (m) => normalizeParentMenuId(m.parentMenuId) === rootMenu.menuId,
        ),
        orphanParentLabel: isOrphan
          ? (fullMenuNameById.get(parentId!) ?? parentId)
          : null,
      };
    });
  }, [pageMenus, pageMenuIdSet, fullMenuNameById]);

  const parentMenuOptions = useMemo(
    () =>
      (fullMenusQuery.data ?? []).filter(
        (m) =>
          normalizeParentMenuId(m.parentMenuId) === null &&
          (!editTarget || m.menuId !== editTarget.menuId),
      ),
    [fullMenusQuery.data, editTarget],
  );

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditTarget(null);
  };

  const handleOpenEditModal = (menu: PlatformMenuItem) => {
    setEditTarget(menu);
    setFormData({
      menuCode: menu.menuCode ?? '',
      menuNm: menu.menuNm,
      menuDc: menu.menuDc,
      menuUrl: menu.menuUrl,
      parentMenuId: normalizeParentMenuId(menu.parentMenuId),
      menuOrdr: menu.menuOrdr,
      iconNm: menu.iconNm,
      useAt: menu.useAt,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const isRootMenu = formData.parentMenuId == null;
    if (!formData.menuNm.trim() || (!isRootMenu && !formData.menuUrl.trim()))
      return;

    setConfirmState({
      type: 'save',
      title: editTarget ? '메뉴 수정 확인' : '메뉴 등록 확인',
      description: editTarget
        ? '수정한 메뉴 정보를 저장하시겠습니까?'
        : '입력한 메뉴 정보를 등록하시겠습니까?',
      confirmText: editTarget ? '저장' : '등록',
      confirmColor: 'primary',
    });
  };

  const executeSave = () => {
    if (editTarget) {
      updateMutation.mutate({
        menuId: editTarget.menuId,
        menuNm: formData.menuNm,
        menuDc: formData.menuDc,
        menuUrl: formData.menuUrl,
        parentMenuId: formData.parentMenuId,
        menuOrdr: formData.menuOrdr,
        iconNm: formData.iconNm,
        useAt: formData.useAt,
      });
      return;
    }
    createMutation.mutate({
      menuCode: formData.menuCode,
      menuNm: formData.menuNm,
      menuDc: formData.menuDc,
      menuUrl: formData.menuUrl,
      parentMenuId: formData.parentMenuId,
      menuOrdr: formData.menuOrdr,
      iconNm: formData.iconNm,
      useAt: formData.useAt,
    });
  };

  const handleDelete = (menu: PlatformMenuItem) => {
    setConfirmState({
      type: 'delete',
      title: '메뉴 삭제 확인',
      description: `'${menu.menuNm}' 메뉴를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      confirmColor: 'error',
      targetMenuId: menu.menuId,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;
    if (confirmState.type === 'delete' && confirmState.targetMenuId) {
      deleteMutation.mutate(confirmState.targetMenuId);
      return;
    }
    executeSave();
  };

  const toggleExpanded = (menuId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Stack spacing={2} data-testid="platform-menu-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.pageTitle.platformMenuManagement}
        description="메뉴 목록을 관리하고 권한과 연결합니다."
      />

      {createMutation.isError ||
      updateMutation.isError ||
      deleteMutation.isError ? (
        <Alert severity="error">작업 처리에 실패했습니다.</Alert>
      ) : null}

      {menusQuery.isError ? (
        <Alert severity="error">메뉴 목록을 불러올 수 없습니다.</Alert>
      ) : null}

      {planAccessQuery.isSuccess && !canManageMenus ? (
        <Alert severity="info">
          현재 요금제에서는 메뉴 변경 기능이 제한됩니다. 요금제를 확인해주세요.
        </Alert>
      ) : null}

      <MenuSearchBar
        value={searchValue}
        loading={menusQuery.isLoading}
        canManage={canManageMenus}
        onChange={setSearchValue}
        onSearch={() => {
          resetPage();
          setAppliedFilters({
            searchField: searchValue.searchField,
            searchKeyword: searchValue.searchKeyword.trim(),
            filterActive: searchValue.filterActive,
          });
        }}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
      />

      <MenuGrid
        rows={gridRows}
        loading={menusQuery.isLoading}
        canManage={canManageMenus}
        deletePending={deleteMutation.isPending}
        expandedIds={expandedIds}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={menusQuery.data?.totalCount ?? 0}
        onToggleExpand={toggleExpanded}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <MenuFormDialog
        open={modalOpen}
        isEdit={Boolean(editTarget)}
        formData={formData}
        parentMenuOptions={parentMenuOptions}
        submitting={isMutating}
        canManage={canManageMenus}
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
