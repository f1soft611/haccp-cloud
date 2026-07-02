import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RoleMenuMappingPanel } from './RoleMenuMappingPanel';

describe('RoleMenuMappingPanel', () => {
  it('uses menuCode as the selection key when available', () => {
    const onToggleMenu = vi.fn();

    render(
      <RoleMenuMappingPanel
        roles={[{ id: '37', code: 'TENANT_ADMIN', name: '업체 관리자' }]}
        menus={[
          {
            menuId: 'PM-2',
            menuCode: 'MENU_LOGIN_HISTORY',
            menuNm: '로그인 이력',
            menuUrl: '/platform/login-history',
          },
        ]}
        selectedRoleId="37"
        selectedMenuIds={['MENU_LOGIN_HISTORY']}
        onSelectRole={vi.fn()}
        onToggleMenu={onToggleMenu}
        onSave={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: '로그인 이력 (/platform/login-history)',
    });

    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    expect(onToggleMenu).toHaveBeenCalledWith('MENU_LOGIN_HISTORY');
  });

  it('selects roles by id', () => {
    const onSelectRole = vi.fn();

    render(
      <RoleMenuMappingPanel
        roles={[
          { id: '37', code: 'PLATFORM_ADMIN', name: '플랫폼 관리자' },
          { id: '38', code: 'TENANT_ADMIN', name: '업체 관리자' },
        ]}
        menus={[]}
        selectedRoleId="37"
        selectedMenuIds={[]}
        onSelectRole={onSelectRole}
        onToggleMenu={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '업체 관리자' }));

    expect(onSelectRole).toHaveBeenCalledWith('38');
  });
});
