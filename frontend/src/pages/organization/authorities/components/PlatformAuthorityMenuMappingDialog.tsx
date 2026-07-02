import {
  Alert,
  Box,
  Button,
  Checkbox,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { PlatformMenuItem } from '../../../../services/platform-admin/platformMenuService';
import type { PlatformRoleItem } from '../../../../services/platform-admin/platformRoleService';

export function PlatformAuthorityMenuMappingDialog(props: {
  open: boolean;
  role: PlatformRoleItem | null;
  menus: PlatformMenuItem[];
  selectedMenuIds: string[];
  loading?: boolean;
  saving?: boolean;
  error?: boolean;
  onChangeSelected: (menuIds: string[]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const {
    open,
    role,
    menus,
    selectedMenuIds,
    loading = false,
    saving = false,
    error = false,
    onChangeSelected,
    onSave,
    onClose,
  } = props;

  const selectedCodeSet = useMemo(
    () => new Set(selectedMenuIds),
    [selectedMenuIds],
  );

  const menuCodeById = useMemo(() => {
    const map = new Map<string, string>();
    menus.forEach((menu) => {
      map.set(menu.menuId, menu.menuCode || menu.menuId);
    });
    return map;
  }, [menus]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string | null, PlatformMenuItem[]>();
    menus.forEach((menu) => {
      const key = menu.parentMenuId ?? null;
      const list = map.get(key) ?? [];
      list.push(menu);
      map.set(key, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => a.menuOrdr - b.menuOrdr);
    });

    return map;
  }, [menus]);

  const descendantCodesByMenuId = useMemo(() => {
    const cache = new Map<string, string[]>();

    const collect = (menuId: string): string[] => {
      if (cache.has(menuId)) {
        return cache.get(menuId) ?? [];
      }

      const selfCode = menuCodeById.get(menuId) ?? menuId;
      const children = childrenByParentId.get(menuId) ?? [];
      const childCodes = children.flatMap((child) => collect(child.menuId));
      const result = [selfCode, ...childCodes];
      cache.set(menuId, result);
      return result;
    };

    menus.forEach((menu) => {
      collect(menu.menuId);
    });

    return cache;
  }, [menus, childrenByParentId, menuCodeById]);

  const getNodeState = (menu: PlatformMenuItem) => {
    const selfCode = menu.menuCode || menu.menuId;
    const descendants = (descendantCodesByMenuId.get(menu.menuId) ?? []).filter(
      (code) => code !== selfCode,
    );
    const allDescendantsChecked =
      descendants.length > 0 &&
      descendants.every((code) => selectedCodeSet.has(code));
    const someDescendantsChecked = descendants.some((code) =>
      selectedCodeSet.has(code),
    );

    const checked = selectedCodeSet.has(selfCode) || allDescendantsChecked;
    const indeterminate = !checked && someDescendantsChecked;

    return { checked, indeterminate };
  };

  const toggleNode = (menu: PlatformMenuItem) => {
    const { checked, indeterminate } = getNodeState(menu);
    const targets = descendantCodesByMenuId.get(menu.menuId) ?? [
      menu.menuCode || menu.menuId,
    ];
    const nextSet = new Set(selectedMenuIds);

    if (checked || indeterminate) {
      targets.forEach((code) => nextSet.delete(code));
    } else {
      targets.forEach((code) => nextSet.add(code));
    }

    onChangeSelected(Array.from(nextSet));
  };

  const flattenTree = (
    parentId: string | null,
    depth: number,
  ): Array<{ menu: PlatformMenuItem; depth: number }> => {
    const nodes = childrenByParentId.get(parentId) ?? [];
    return nodes.flatMap((menu) => [
      { menu, depth },
      ...flattenTree(menu.menuId, depth + 1),
    ]);
  };

  const treeRows = flattenTree(null, 0);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      title="권한별 메뉴 매핑"
      description={
        role
          ? `${role.name} (${role.code}) 권한에 노출할 메뉴를 선택하세요.`
          : '권한을 선택한 뒤 메뉴 매핑을 설정하세요.'
      }
      actions={
        <>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!role || saving}
          >
            저장
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      {error ? (
        <Alert severity="warning">메뉴 매핑 정보를 불러오지 못했습니다.</Alert>
      ) : null}

      <AdminGrid ariaLabel="권한별 메뉴 매핑 목록" maxHeight={420}>
        <TableHead>
          <TableRow>
            <TableCell width={70} align="center">
              선택
            </TableCell>
            <TableCell>메뉴 트리</TableCell>
            <TableCell>URL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`platform-authority-menu-grid-skeleton-${index}`}
                data-testid={`platform-role-menu-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={20}
                    height={20}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="68%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width="92%" height={24} />
                </TableCell>
              </TableRow>
            ))
          ) : treeRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" color="text.secondary">
                  등록된 메뉴가 없습니다.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            treeRows.map(({ menu, depth }) => {
              const { checked, indeterminate } = getNodeState(menu);

              return (
                <TableRow key={menu.menuId} hover>
                  <TableCell align="center">
                    <Checkbox
                      checked={checked}
                      indeterminate={indeterminate}
                      onChange={() => toggleNode(menu)}
                      inputProps={{
                        'aria-label': `${menu.menuNm} (${menu.menuUrl || '-'})`,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: depth * 16, flexShrink: 0 }} />
                      <Typography variant="body2">{menu.menuNm}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({menu.menuCode || menu.menuId})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{menu.menuUrl || '-'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </AdminGrid>
    </FormDialog>
  );
}
