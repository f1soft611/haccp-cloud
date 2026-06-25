import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
  type UserItem,
} from '../../../services/common/usersService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { listPlatformRoles } from '../../../services/platform/platformRoleService';
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

export function UsersPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);

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

  const usersQuery = useQuery({
    queryKey: ['users', tenantCode || 'self'],
    queryFn: () => listUsers(tenantCode || undefined),
  });

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
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

  const filteredUsers = useMemo(() => {
    const keyword = appliedSearch.keyword.trim().toLowerCase();

    return (usersQuery.data ?? []).filter((user) => {
      if (
        appliedSearch.filterActive !== 'all' &&
        user.active !== (appliedSearch.filterActive === 'Y')
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const target =
        `${user.name} ${user.email} ${user.department}`.toLowerCase();
      return target.includes(keyword);
    });
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setFormOpen(false);
      setEditingUser(null);
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
      void queryClient.invalidateQueries({
        queryKey: ['users', tenantCode || 'self'],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      setStatusTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ['users', tenantCode || 'self'],
      });
    },
  });

  const handleSearch = () => {
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
      roleCodes: [value.roleCode],
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
        rows={filteredUsers}
        loading={usersQuery.isLoading}
        onEdit={handleOpenEdit}
        onToggle={(user) => setStatusTarget(user)}
      />

      <UserFormDialog
        open={formOpen}
        mode={editingUser ? 'edit' : 'create'}
        saving={createMutation.isPending || updateMutation.isPending}
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
    </Stack>
  );
}
