import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { listPlatformMenus } from '../../../services/platform/platformMenuService';
import { listPlatformRoles } from '../../../services/platform/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  savePlatformRoleMenuMapping,
} from '../../../services/platform/platformRoleMenuService';

export function PlatformRoleMenuManagementPage() {
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

  const effectiveRoleCode =
    selectedRoleCode || rolesQuery.data?.[0]?.code || '';

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode),
    enabled: effectiveRoleCode.length > 0,
  });

  const selectedMenuIds = draftMenuIds ?? mappingQuery.data?.menuIds ?? [];

  const saveMutation = useMutation({
    mutationFn: savePlatformRoleMenuMapping,
  });

  const toggleMenu = (menuId: string) => {
    setDraftMenuIds((prev) => {
      const base = prev ?? mappingQuery.data?.menuIds ?? [];
      return base.includes(menuId)
        ? base.filter((id) => id !== menuId)
        : [...base, menuId];
    });
  };

  const handleSave = () => {
    if (!effectiveRoleCode) {
      return;
    }

    saveMutation.mutate({
      roleCode: effectiveRoleCode,
      menuIds: selectedMenuIds,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-role-menu-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.pageTitle.platformRoleMenuManagement}
        description="권한별 메뉴 노출 관계를 설정합니다."
      />

      {saveMutation.isSuccess ? (
        <Alert severity="success">권한별 메뉴 매핑이 저장되었습니다.</Alert>
      ) : null}
      {saveMutation.isError ? (
        <Alert severity="warning">권한별 메뉴 저장에 실패했습니다.</Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 1.5 }}>
          {(rolesQuery.data ?? []).map((role) => (
            <Button
              key={role.id}
              variant={
                effectiveRoleCode === role.code ? 'contained' : 'outlined'
              }
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
          onClick={handleSave}
          disabled={saveMutation.isPending || !effectiveRoleCode}
        >
          {APP_LABELS.action.save}
        </Button>
      </Paper>
    </Stack>
  );
}
