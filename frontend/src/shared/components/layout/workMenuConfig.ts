import type { UserRole } from '../../store/authStore';

export type MenuIconName =
  | 'Dashboard'
  | 'Settings'
  | 'Menu'
  | 'Factory'
  | 'AdminPanelSettings'
  | 'Business'
  | 'People'
  | 'Assignment'
  | 'Inventory'
  | 'Build'
  | 'Category'
  | 'Security'
  | 'Link'
  | 'History'
  | 'AccessTime';

export type MenuItem = {
  label: string;
  description?: string;
  path: string;
  roles: UserRole[];
  icon?: MenuIconName;
};

export type MenuGroup = {
  key: string;
  label: string;
  roles: UserRole[];
  items: MenuItem[];
};

export type AccessibleMenuHierarchyMeta = {
  menuId?: number;
  parentMenuId?: number | null;
  menuCode?: string;
  menuNm?: string;
  menuDc?: string;
  path: string;
  iconNm?: string;
  menuOrdr?: number;
};

const MENU_ICON_NAMES: MenuIconName[] = [
  'Dashboard',
  'Settings',
  'Menu',
  'Factory',
  'AdminPanelSettings',
  'Business',
  'People',
  'Assignment',
  'Inventory',
  'Build',
  'Category',
  'Security',
  'Link',
  'History',
  'AccessTime',
];

const MENU_ICON_NAME_SET = new Set<MenuIconName>(MENU_ICON_NAMES);

export function toMenuIconName(iconName?: string): MenuIconName | undefined {
  if (!iconName) {
    return undefined;
  }

  const normalized = iconName.trim();
  if (MENU_ICON_NAME_SET.has(normalized as MenuIconName)) {
    return normalized as MenuIconName;
  }

  return undefined;
}

function toSortedMenus(menus: AccessibleMenuHierarchyMeta[]) {
  return [...menus].sort((a, b) => {
    const orderA = a.menuOrdr ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.menuOrdr ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (
      (a.menuId ?? Number.MAX_SAFE_INTEGER) -
      (b.menuId ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function buildMenuGroupsFromAccessibleMenus(
  role: UserRole,
  menus: AccessibleMenuHierarchyMeta[],
  accessiblePaths: string[],
): MenuGroup[] {
  if (menus.length === 0) {
    return [];
  }

  const roots = toSortedMenus(menus).filter(
    (menu) => menu.parentMenuId == null,
  );

  const allowedPathSet = new Set(accessiblePaths);
  const childrenByParentId = new Map<number, AccessibleMenuHierarchyMeta[]>();

  menus.forEach((menu) => {
    if (menu.parentMenuId == null) {
      return;
    }

    const list = childrenByParentId.get(menu.parentMenuId) ?? [];
    list.push(menu);
    childrenByParentId.set(menu.parentMenuId, list);
  });

  if (roots.length === 0) {
    return toSortedMenus(menus)
      .filter((menu) => menu.path.length > 0 && allowedPathSet.has(menu.path))
      .map((menu) => ({
        key:
          menu.menuCode ||
          (menu.menuId != null
            ? `menu-group-${menu.menuId}`
            : `menu-group-${menu.path}`),
        label: menu.menuNm || menu.path,
        roles: [role],
        items: [
          {
            label: menu.menuNm || menu.path,
            description: menu.menuDc,
            path: menu.path,
            roles: [role],
            icon: toMenuIconName(menu.iconNm),
          },
        ],
      }));
  }

  return roots
    .map((root): MenuGroup | null => {
      const directChildren =
        root.menuId == null
          ? []
          : toSortedMenus(childrenByParentId.get(root.menuId) ?? []);

      const items: MenuItem[] = directChildren
        .filter(
          (child) => child.path.length > 0 && allowedPathSet.has(child.path),
        )
        .map((child) => ({
          label: child.menuNm || child.path,
          description: child.menuDc,
          path: child.path,
          roles: [role],
          icon: toMenuIconName(child.iconNm),
        }));

      if (
        items.length === 0 &&
        root.path.length > 0 &&
        allowedPathSet.has(root.path)
      ) {
        items.push({
          label: root.menuNm || root.path,
          description: root.menuDc,
          path: root.path,
          roles: [role],
          icon: toMenuIconName(root.iconNm),
        });
      }

      if (items.length === 0) {
        return null;
      }

      return {
        key:
          root.menuCode ||
          (root.menuId != null
            ? `menu-group-${root.menuId}`
            : `menu-group-${root.path}`),
        label: root.menuNm || root.path,
        roles: [role],
        items,
      };
    })
    .filter((group): group is MenuGroup => group !== null);
}
