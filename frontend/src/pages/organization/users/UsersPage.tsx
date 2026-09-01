import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
  createUser,
  listUsersPaged,
  resetUserPassword,
  updateUser,
  updateUserStatus,
  type UserItem,
} from '../../../services/organization/usersService';
import { listDepartments } from '../../../services/organization/departmentsService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { listPlatformRoles } from '../../../services/platform-admin/platformRoleService';
import {
  UsersSearchBar,
  type UsersSearchValue,
} from './components/UsersSearchBar';
import { UsersGrid } from './components/UsersGrid';
import {
  UserFormDialog,
  type UserFormValue,
} from './components/UserFormDialog';
import { UserStatusDialog } from './components/UserStatusDialog';
import { UserPasswordResetDialog } from './components/UserPasswordResetDialog';

export function UsersPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<UsersSearchValue>({
    keyword: '',
    filterActive: 'all',
  });
  const [appliedSearch, setAppliedSearch] = useState<UsersSearchValue>({
    keyword: '',
    filterActive: 'all',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserItem | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<UserItem | null>(null);

  const usersQuery = useQuery({
    queryKey: [
      'users',
      tenantCode || 'self',
      pageIndex,
      pageSize,
      appliedSearch.keyword,
      appliedSearch.filterActive,
    ],
    queryFn: () =>
      listUsersPaged({
        tenantCode: tenantCode || undefined,
        pageIndex,
        pageSize,
        keyword: appliedSearch.keyword || undefined,
        filterActive: appliedSearch.filterActive,
      }),
    retry: false,
  });

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
    retry: false,
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments', tenantCode || ''],
    queryFn: () =>
      listDepartments({
        tenantCode: tenantCode || '',
      }),
    enabled: Boolean(tenantCode),
    retry: false,
  });

  const roleOptions = useMemo(() => {
    return (rolesQuery.data ?? [])
      .filter((item) => item.active)
      .map((item) => ({
        code: item.code,
        name: item.name,
      }));
  }, [rolesQuery.data]);

  const roleNameByCode = useMemo(() => {
    return roleOptions.reduce<Record<string, string>>((acc, item) => {
      acc[item.code.trim().toUpperCase()] = item.name;
      return acc;
    }, {});
  }, [roleOptions]);

  const departmentOptions = useMemo(() => {
    return (departmentsQuery.data ?? [])
      .filter((item) => item.active)
      .map((item) => item.name)
      .filter((item) => item.length > 0);
  }, [departmentsQuery.data]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setFormOpen(false);
      setEditingUser(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['users', tenantCode || 'self'],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      setFormOpen(false);
      setEditingUser(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['users', tenantCode || 'self'],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      setStatusTarget(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['users', tenantCode || 'self'],
      });
    },
  });

  const { showSuccess } = useFeedback();

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (tempPassword) => {
      setResetPasswordTarget(null);
      showSuccess(`비밀번호가 초기화되었습니다. 임시 비밀번호: ${tempPassword}`);
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
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleSubmitForm = (value: UserFormValue) => {
    const payload = {
      tenantCode: tenantCode || undefined,
      name: value.name,
      email: value.email,
      department: value.department,
      roleCode: value.roleCode,
      active: value.active,
    };

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        ...payload,
      });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleConfirmToggle = () => {
    if (!statusTarget) {
      return;
    }

    statusMutation.mutate({
      tenantCode: tenantCode || undefined,
      id: statusTarget.id,
      active: !statusTarget.active,
    });
  };

  return (
    <Stack spacing={2} data-testid="tenant-users-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.users}
        description="사용자 계정, 권한, 로그인 가능 상태를 운영합니다."
      />

      {usersQuery.isError ? (
        <Alert severity="warning">사용자 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <UsersSearchBar
        value={searchValue}
        disabled={usersQuery.isLoading}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onCreate={handleOpenCreate}
      />

      <UsersGrid
        rows={usersQuery.data?.items ?? []}
        roleNameByCode={roleNameByCode}
        loading={usersQuery.isLoading}
        onEdit={handleOpenEdit}
        onToggle={(user) => setStatusTarget(user)}
      />

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={usersQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <UserFormDialog
          open={formOpen}
          mode={editingUser ? 'edit' : 'create'}
          saving={createMutation.isPending || updateMutation.isPending}
          resettingPassword={resetPasswordMutation.isPending}
          departmentOptions={departmentOptions}
          roleOptions={roleOptions}
          initialValue={
            editingUser
                ? {
                  name: editingUser.name,
                  email: editingUser.email,
                  department: editingUser.department,
                  roleCode: editingUser.roleCode,
                  active: editingUser.active,
                }
                : undefined
          }
          onClose={() => {
            if (createMutation.isPending || updateMutation.isPending) {
              return;
            }
            setFormOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSubmitForm}
          onResetPassword={
            editingUser ? () => setResetPasswordTarget(editingUser) : undefined
          }
      />

      <UserStatusDialog
        open={Boolean(statusTarget)}
        target={statusTarget}
        saving={statusMutation.isPending}
        onClose={() => {
          if (statusMutation.isPending) {
            return;
          }
          setStatusTarget(null);
        }}
        onConfirm={handleConfirmToggle}
      />

      <UserPasswordResetDialog
          open={Boolean(resetPasswordTarget)}
          target={resetPasswordTarget}
          saving={resetPasswordMutation.isPending}
          onClose={() => {
            if (resetPasswordMutation.isPending) {
              return;
            }
            setResetPasswordTarget(null);
          }}
          onConfirm={() => {
            if (!resetPasswordTarget) {
              return;
            }
            resetPasswordMutation.mutate({
              tenantCode: tenantCode || undefined,
              id: resetPasswordTarget.id,
            });
          }}
      />
    </Stack>
  );
}
