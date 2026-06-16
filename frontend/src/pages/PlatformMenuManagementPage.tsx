import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
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
import type { UserRole } from '../shared/store/authStore';
import { APP_LABELS, getActiveLabel } from '../shared/ui/labels';
import {
  createPlatformMenu,
  listPlatformMenus,
  updatePlatformMenuStatus,
  type PlatformMenuItem,
} from '../services/platformMenuService';

const ROLE_OPTIONS: UserRole[] = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'];

export function PlatformMenuManagementPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [roles, setRoles] = useState<UserRole[]>(['PLATFORM_ADMIN']);

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const createMutation = useMutation({
    mutationFn: createPlatformMenu,
    onSuccess: () => {
      setName('');
      setPath('');
      setSortOrder(10);
      setRoles(['PLATFORM_ADMIN']);
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updatePlatformMenuStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
    },
  });

  const toggleRole = (role: UserRole) => {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role],
    );
  };

  const handleCreate = () => {
    if (!name.trim() || !path.trim() || roles.length === 0) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      path: path.trim(),
      sortOrder,
      active: true,
      roles,
    });
  };

  const handleToggleActive = (item: PlatformMenuItem) => {
    statusMutation.mutate({
      id: item.id,
      active: !item.active,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-menu-management-page">
      <Typography variant="h4">
        {APP_LABELS.pageTitle.platformMenuManagement}
      </Typography>

      {createMutation.isError ? (
        <Alert severity="warning">메뉴 등록 처리에 실패했습니다.</Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            label="메뉴명"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="경로"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/platform/menus"
          />
          <TextField
            type="number"
            label="정렬"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value) || 0)}
            sx={{ maxWidth: 140 }}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {APP_LABELS.action.save}
          </Button>
        </Stack>
        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
          {ROLE_OPTIONS.map((role) => (
            <FormControlLabel
              key={role}
              control={
                <Checkbox
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
              }
              label={role}
            />
          ))}
        </Stack>
      </Paper>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>메뉴명</TableCell>
            <TableCell>경로</TableCell>
            <TableCell>정렬</TableCell>
            <TableCell>권한</TableCell>
            <TableCell>{APP_LABELS.table.status}</TableCell>
            <TableCell align="right">{APP_LABELS.table.action}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(menusQuery.data ?? []).map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.path}</TableCell>
              <TableCell>{item.sortOrder}</TableCell>
              <TableCell>{item.roles.join(', ')}</TableCell>
              <TableCell>{getActiveLabel(item.active)}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => handleToggleActive(item)}>
                  {item.active
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
