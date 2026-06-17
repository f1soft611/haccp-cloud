import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createUser,
  listUsers,
  updateUserStatus,
  type UserItem,
} from '../../../services/common/usersService';
import {
  APP_LABELS,
  getActiveLabel,
  getRoleLabel,
} from '../../../shared/constants/labels';

export function UsersPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('품질관리팀');

  const usersQuery = useQuery({
    queryKey: ['users', tenantCode],
    queryFn: () => listUsers(tenantCode),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setName('');
      setEmail('');
      void queryClient.invalidateQueries({ queryKey: ['users', tenantCode] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', tenantCode] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      tenantCode,
      name,
      email,
      department,
      role: 'USER',
    });
  };

  const handleToggle = (row: UserItem) => {
    statusMutation.mutate({
      tenantCode,
      id: row.id,
      active: !row.active,
    });
  };

  return (
    <Stack spacing={2}>
      <PageHeader
        groupLabel={APP_LABELS.menu.dashboardGroup}
        title={APP_LABELS.pageTitle.users}
        description="사용자 계정과 권한을 관리합니다."
      />
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            label={APP_LABELS.field.name}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label={APP_LABELS.field.email}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label={APP_LABELS.field.department}
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {APP_LABELS.action.addUser}
          </Button>
        </Stack>
      </Paper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{APP_LABELS.table.name}</TableCell>
            <TableCell>{APP_LABELS.table.email}</TableCell>
            <TableCell>{APP_LABELS.table.department}</TableCell>
            <TableCell>{APP_LABELS.table.role}</TableCell>
            <TableCell>{APP_LABELS.table.status}</TableCell>
            <TableCell align="right">{APP_LABELS.table.action}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(usersQuery.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{getRoleLabel(row.role)}</TableCell>
              <TableCell>{getActiveLabel(row.active)}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => handleToggle(row)}>
                  {row.active
                    ? APP_LABELS.action.deactivate
                    : APP_LABELS.action.activate}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
