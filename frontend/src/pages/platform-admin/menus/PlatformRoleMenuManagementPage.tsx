import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { listCommonPlatformMenus } from '../../../services/platform-admin/platformMenuService';
import { listPlatformRoles } from '../../../services/platform-admin/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  listRoleMenuCandidatesByTenant,
  savePlatformRoleMenuMapping,
} from '../../../services/platform-admin/platformRoleMenuService';
import { useAuthStore } from '../../../shared/store/authStore';
import { RoleMenuMappingPanel } from './components/RoleMenuMappingPanel';

export function PlatformRoleMenuManagementPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
  });

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listCommonPlatformMenus,
  });

  const resolvedTenantCode = tenantCode?.trim().toUpperCase() || 'PLATFORM';

  const menuCandidatesQuery = useQuery({
    queryKey: ['platform-admin', 'role-menu-candidates', resolvedTenantCode],
    queryFn: () => listRoleMenuCandidatesByTenant(resolvedTenantCode),
  });

  const effectiveRoleId = selectedRoleId || rolesQuery.data?.[0]?.id || '';
  const effectiveRoleCode =
    rolesQuery.data?.find((role) => role.id === effectiveRoleId)?.code ??
    effectiveRoleId;

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode, tenantCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode, tenantCode),
    enabled: effectiveRoleCode.length > 0,
  });

  const candidateCodeSet = new Set(menuCandidatesQuery.data ?? []);
  const normalizedSelectedMenuIds = (
    draftMenuIds ??
    mappingQuery.data?.menuIds ??
    []
  )
    .map((menuId) => menuId.trim().toUpperCase())
    .filter((menuId) => menuId.length > 0 && candidateCodeSet.has(menuId));
  const selectedMenuIds = normalizedSelectedMenuIds;

  const filteredMenus = (menusQuery.data ?? []).filter((menu) => {
    const menuCode = menu.menuCode?.trim().toUpperCase() || '';
    return menuCode.length > 0 && candidateCodeSet.has(menuCode);
  });

  const saveMutation = useMutation({
    mutationFn: savePlatformRoleMenuMapping,
  });

  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    setDraftMenuIds(null);
  };

  const handleToggleMenu = (menuId: string) => {
    setDraftMenuIds((prev) => {
      const base = (prev ?? mappingQuery.data?.menuIds ?? [])
        .map((id) => id.trim().toUpperCase())
        .filter((id) => id.length > 0 && candidateCodeSet.has(id));
      const normalizedMenuId = menuId.trim().toUpperCase();
      if (!candidateCodeSet.has(normalizedMenuId)) {
        return base;
      }
      return base.includes(normalizedMenuId)
        ? base.filter((id) => id !== normalizedMenuId)
        : [...base, normalizedMenuId];
    });
  };

  const handleSave = () => {
    if (!effectiveRoleCode) return;
    saveMutation.mutate({
      roleCode: effectiveRoleCode,
      tenantCode,
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
        menus={filteredMenus}
        selectedRoleId={effectiveRoleId}
        selectedMenuIds={selectedMenuIds}
        submitting={saveMutation.isPending}
        onSelectRole={handleSelectRole}
        onToggleMenu={handleToggleMenu}
        onSave={handleSave}
      />
    </Stack>
  );
}
