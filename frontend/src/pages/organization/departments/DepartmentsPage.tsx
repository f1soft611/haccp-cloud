import { Button, Paper, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createDepartment,
  listDepartments,
  updateDepartmentStatus,
} from '../../../services/organization/departmentsService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { DepartmentGrid } from './components/DepartmentGrid';

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const [name, setName] = useState('');

  const departmentsQuery = useQuery({
    queryKey: ['departments', tenantCode],
    queryFn: () => listDepartments(tenantCode),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({
        queryKey: ['departments', tenantCode],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateDepartmentStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['departments', tenantCode],
      });
    },
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.departments}
        description="부서 정보를 등록하고 수정합니다."
      />
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            label={APP_LABELS.field.departmentName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => createMutation.mutate({ tenantCode, name })}
            disabled={createMutation.isPending}
          >
            {APP_LABELS.action.addDepartment}
          </Button>
        </Stack>
      </Paper>

      <DepartmentGrid
        rows={departmentsQuery.data ?? []}
        onToggleActive={(row) =>
          statusMutation.mutate({ tenantCode, id: row.id, active: !row.active })
        }
      />
    </Stack>
  );
}
