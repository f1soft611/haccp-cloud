import { Alert, Button, Paper, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import {
  createPlatformRole,
  listPlatformRoles,
  updatePlatformRoleStatus,
  type PlatformRoleItem,
} from '../../../services/platform-admin/platformRoleService';
import { RoleGrid } from './components/RoleGrid';

export function PlatformRoleManagementPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
  });

  const createMutation = useMutation({
    mutationFn: createPlatformRole,
    onSuccess: () => {
      setCode('');
      setName('');
      setDescription('');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles'],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updatePlatformRoleStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles'],
      });
    },
  });

  const handleCreate = () => {
    if (!code.trim() || !name.trim()) {
      return;
    }

    createMutation.mutate({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      active: true,
    });
  };

  const handleToggleActive = (item: PlatformRoleItem) => {
    statusMutation.mutate({
      id: item.id,
      active: !item.active,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-role-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.pageTitle.platformRoleManagement}
        description="권한 코드를 등록하고 활성 상태를 관리합니다."
      />

      {createMutation.isError ? (
        <Alert severity="warning">권한 등록 처리에 실패했습니다.</Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            label="권한 코드"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ROLE_QA_MANAGER"
          />
          <TextField
            label="권한명"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label={APP_LABELS.field.content}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {APP_LABELS.action.save}
          </Button>
        </Stack>
      </Paper>

      <RoleGrid
        rows={rolesQuery.data ?? []}
        onToggleActive={handleToggleActive}
      />
    </Stack>
  );
}
