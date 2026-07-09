import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpBaseCategoryManagementPage } from '../pages/documents/haccp-base/HaccpBaseCategoryManagementPage';

const {
  listHaccpBaseCategoriesMock,
  createHaccpBaseCategoryMock,
  updateHaccpBaseCategoryMock,
} = vi.hoisted(() => ({
  listHaccpBaseCategoriesMock: vi.fn(async () => [
    {
      id: '1',
      tenantCode: 'PLATFORM',
      categoryCode: '001',
      categoryName: 'HACCP문서(HA)',
      sortOrder: 1,
      active: true,
      createdBy: '100',
      createdAt: '2026-07-07 09:00',
    },
  ]),
  createHaccpBaseCategoryMock: vi.fn(async (payload) => ({
    id: '2',
    tenantCode: payload.tenantCode,
    categoryCode: payload.categoryCode,
    categoryName: payload.categoryName,
    sortOrder: payload.sortOrder,
    active: payload.active,
    createdBy: '100',
    createdAt: '2026-07-07 09:05',
  })),
  updateHaccpBaseCategoryMock: vi.fn(async (payload) => ({
    id: payload.id,
    tenantCode: payload.tenantCode,
    categoryCode: '001',
    categoryName: payload.categoryName,
    sortOrder: payload.sortOrder,
    active: payload.active,
    createdBy: '100',
    createdAt: '2026-07-07 09:00',
  })),
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/documents/haccpBaseCategoryService', () => ({
  listHaccpBaseCategories: listHaccpBaseCategoriesMock,
  createHaccpBaseCategory: createHaccpBaseCategoryMock,
  updateHaccpBaseCategory: updateHaccpBaseCategoryMock,
}));

describe('HaccpBaseCategoryManagementPage', () => {
  it('renders category grid and opens create dialog', () => {
    render(
      <AppProviders>
        <HaccpBaseCategoryManagementPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', { name: '업무 분류 관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '분류코드' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ 분류 추가' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ 분류 추가' }));
    expect(
      screen.getByRole('dialog', { name: /분류 추가/ }),
    ).toBeInTheDocument();
  });

  it('opens edit dialog and keeps category code read-only', () => {
    render(
      <AppProviders>
        <HaccpBaseCategoryManagementPage />
      </AppProviders>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '분류 수정' })[0]);
    expect(
      screen.getByRole('dialog', { name: /분류 수정/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '분류코드' })).toBeDisabled();
  });

  it('navigates back to haccp base page', () => {
    render(
      <AppProviders>
        <HaccpBaseCategoryManagementPage />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '양식관리로' }));
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base');
  });
});
