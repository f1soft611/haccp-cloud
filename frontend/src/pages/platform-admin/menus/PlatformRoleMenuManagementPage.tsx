import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { listPlatformMenus } from '../../../services/platform-admin/platformMenuService';
import { listPlatformRoles } from '../../../services/platform-admin/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  savePlatformRoleMenuMapping,
} from '../../../services/platform-admin/platformRoleMenuService';
import { RoleMenuMappingPanel } from './components/RoleMenuMappingPanel';

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

  const handleSelectRole = (code: string) => {
    setSelectedRoleCode(code);
    setDraftMenuIds(null);
  };

  const handleToggleMenu = (menuId: string) => {
    setDraftMenuIds((prev) => {
      const base = prev ?? mappingQuery.data?.menuIds ?? [];
      return base.includes(menuId)
        ? base.filter((id) => id !== menuId)
        : [...base, menuId];
    });
  };

  const handleSave = () => {
    if (!effectiveRoleCode) return;
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

      <RoleMenuMappingPanel
        roles={rolesQuery.data ?? []}
        menus={menusQuery.data ?? []}
        selectedRoleCode={effectiveRoleCode}
        selectedMenuIds={selectedMenuIds}
        submitting={saveMutation.isPending}
        onSelectRole={handleSelectRole}
        onToggleMenu={handleToggleMenu}
        onSave={handleSave}
      />
    </Stack>
  );
}

