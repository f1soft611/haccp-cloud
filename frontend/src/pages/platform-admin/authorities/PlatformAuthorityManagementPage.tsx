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
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS, getActiveLabel } from '../../../shared/constants/labels';
import { listPlatformMenus } from '../../../services/platform/platformMenuService';
import {
  createPlatformRole,
  listPlatformRoles,
  updatePlatformRoleStatus,
  type PlatformRoleItem,
} from '../../../services/platform/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  savePlatformRoleMenuMapping,
} from '../../../services/platform/platformRoleMenuService';

export function PlatformAuthorityManagementPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
  });

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const effectiveRoleCode = selectedRoleCode || rolesQuery.data?.[0]?.code || '';

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode),
    enabled: effectiveRoleCode.length > 0,
  });

  const selectedMenuIds = draftMenuIds ?? mappingQuery.data?.menuIds ?? [];

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

  const saveMutation = useMutation({
    mutationFn: savePlatformRoleMenuMapping,
    onSuccess: (_, payload) => {
      setDraftMenuIds(null);
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'role-menus', payload.roleCode],
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
      code: item.code,
      active: !item.active,
    });
  };

  const toggleMenu = (menuId: string) => {
    setDraftMenuIds((prev) => {
      const base = prev ?? mappingQuery.data?.menuIds ?? [];
      return base.includes(menuId)
        ? base.filter((id) => id !== menuId)
        : [...base, menuId];
    });
  };

  const handleSaveMapping = () => {
    if (!effectiveRoleCode) {
      return;
    }

    saveMutation.mutate({
      roleCode: effectiveRoleCode,
      menuIds: selectedMenuIds,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-authority-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={APP_LABELS.pageTitle.platformRoleManagement}
        description="권한 등록, 상태 관리, 권한별 메뉴 매핑을 한 화면에서 처리합니다."
      />

      {createMutation.isError ? (
        <Alert severity="warning">권한 등록 처리에 실패했습니다.</Alert>
      ) : null}
      {statusMutation.isError ? (
        <Alert severity="warning">권한 상태 변경에 실패했습니다.</Alert>
      ) : null}
      {saveMutation.isSuccess ? (
        <Alert severity="success">권한별 메뉴 매핑이 저장되었습니다.</Alert>
      ) : null}
      {saveMutation.isError ? (
        <Alert severity="warning">권한별 메뉴 저장에 실패했습니다.</Alert>
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>권한 코드</TableCell>
            <TableCell>권한명</TableCell>
            <TableCell>{APP_LABELS.field.content}</TableCell>
            <TableCell>{APP_LABELS.table.status}</TableCell>
            <TableCell align="right">{APP_LABELS.table.action}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rolesQuery.data ?? []).map((item) => (
            <TableRow key={item.code} hover>
              <TableCell>{item.code}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description || '-'}</TableCell>
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

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 1.5 }}>
          {(rolesQuery.data ?? []).map((role) => (
            <Button
              key={role.code}
              variant={effectiveRoleCode === role.code ? 'contained' : 'outlined'}
              size="small"
              onClick={() => {
                setSelectedRoleCode(role.code);
                setDraftMenuIds(null);
              }}
            >
              {role.name}
            </Button>
          ))}
        </Stack>

        <Stack spacing={0.5}>
          {(menusQuery.data ?? []).map((menu) => (
            <FormControlLabel
              key={menu.menuId}
              control={
                <Checkbox
                  checked={selectedMenuIds.includes(menu.menuId)}
                  onChange={() => toggleMenu(menu.menuId)}
                />
              }
              label={`${menu.menuNm} (${menu.menuUrl})`}
            />
          ))}
        </Stack>

        <Button
          variant="contained"
          sx={{ mt: 1.5 }}
          onClick={handleSaveMapping}
          disabled={saveMutation.isPending || !effectiveRoleCode}
        >
          {APP_LABELS.action.save}
        </Button>
      </Paper>
    </Stack>
  );
}
