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
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createDepartment,
  listDepartments,
  updateDepartmentStatus,
} from '../../../services/common/departmentsService';
import { APP_LABELS, getActiveLabel } from '../../../shared/constants/labels';

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
      <Typography variant="h4">{APP_LABELS.pageTitle.departments}</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            label={APP_LABELS.field.departmentName}
            value={name}
            onChange={(event) => setName(event.target.value)}
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{APP_LABELS.table.name}</TableCell>
            <TableCell>{APP_LABELS.table.status}</TableCell>
            <TableCell align="right">{APP_LABELS.table.action}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(departmentsQuery.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{getActiveLabel(row.active)}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() =>
                    statusMutation.mutate({
                      tenantCode,
                      id: row.id,
                      active: !row.active,
                    })
                  }
                >
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
