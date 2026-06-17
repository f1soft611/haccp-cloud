import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformMenuManagementPage } from '../pages/platform-admin/menus/PlatformMenuManagementPage';

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: vi.fn(async () => [
    {
      menuId: 'PM-1',
      menuNm: '테스트 메뉴',
      menuDc: '테스트 설명',
      menuUrl: '/test',
      parentMenuId: null,
      menuOrdr: 1,
      iconNm: 'Menu',
      useAt: 'Y',
    },
  ]),
  createPlatformMenu: vi.fn(),
  updatePlatformMenu: vi.fn(),
  deletePlatformMenu: vi.fn(),
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformMenuManagementPage />
    </AppProviders>,
  );
}

describe('PlatformMenuManagementPage', () => {
  it('uses shared FormDialog for menu edit modal', async () => {
    renderPage();

    await screen.findByText('테스트 메뉴');

    const editIcons = await screen.findAllByTestId('EditOutlinedIcon');
    const firstEditButton = editIcons[0]?.closest('button');

    expect(firstEditButton).not.toBeNull();

    fireEvent.click(firstEditButton as HTMLButtonElement);

    expect(await screen.findByTestId('form-dialog-actions')).toBeInTheDocument();
  });

  it('renders add modal actions in order: 추가 then 취소', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '+ 메뉴 추가' }));

    const addButton = await screen.findByRole('button', { name: '추가' });
    const cancelButton = await screen.findByRole('button', { name: '취소' });

    const buttonPosition = addButton.compareDocumentPosition(cancelButton);
    expect(buttonPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
