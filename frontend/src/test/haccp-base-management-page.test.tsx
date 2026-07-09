import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpBaseManagementPage } from '../pages/documents/haccp-base/HaccpBaseManagementPage';

const { listHaccpBaseCategoriesMock, listHaccpBaseWorksMock, listUsersMock } =
  vi.hoisted(() => ({
    listHaccpBaseCategoriesMock: vi.fn(async () => [
      {
        id: '10',
        tenantCode: 'PLATFORM',
        categoryCode: '001',
        categoryName: 'HACCP문서(HA)',
        sortOrder: 1,
        active: true,
        createdBy: '관리자',
        createdAt: '2026-07-07 10:00',
      },
    ]),
    listHaccpBaseWorksMock: vi.fn(async () => [
      {
        id: '1',
        tenantCode: 'PLATFORM',
        categoryGroupId: '10',
        categoryCode: '001',
        categoryName: 'HACCP문서(HA)',
        divisionCode: '001',
        divisionName: '기안서',
        cycle: '일',
        active: true,
        createdBy: '고대성',
        createdAt: '2026-07-07 10:00',
        owner: '검토:금도연 / 승인:고대성',
        reviewerId: '101',
        reviewerName: '금도연',
        approverId: '102',
        approverName: '고대성',
        assigneeMapped: true,
      },
    ]),
    listUsersMock: vi.fn(async () => [
      {
        id: '101',
        tenantCode: 'PLATFORM',
        name: '금도연',
        email: 'reviewer@f1soft.co.kr',
        department: '품질팀',
        roleCode: 'TENANT_USER',
        roleCodes: ['TENANT_USER'],
        role: 'TENANT_USER',
        active: true,
      },
      {
        id: '102',
        tenantCode: 'PLATFORM',
        name: '고대성',
        email: 'approver@f1soft.co.kr',
        department: '품질팀',
        roleCode: 'TENANT_USER',
        roleCodes: ['TENANT_USER'],
        role: 'TENANT_USER',
        active: true,
      },
    ]),
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
}));

vi.mock('../services/documents/haccpBaseWorkService', () => ({
  listHaccpBaseWorks: listHaccpBaseWorksMock,
  createHaccpBaseWork: vi.fn(),
  updateHaccpBaseWork: vi.fn(),
}));

vi.mock('../services/organization/usersService', () => ({
  listUsers: listUsersMock,
}));

describe('HaccpBaseManagementPage', () => {
  it('renders columns and opens create modal', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    expect(await screen.findByText('No')).toBeInTheDocument();
    expect(await screen.findByText('구분명')).toBeInTheDocument();
    expect(await screen.findByText('분류')).toBeInTheDocument();
    expect(await screen.findByText('등록주기')).toBeInTheDocument();
    expect(await screen.findByText('등록자')).toBeInTheDocument();
    expect(await screen.findByText('등록일')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '분류 설정' }));
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/categories');

    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    expect(
      screen.getByRole('dialog', { name: /업무 추가/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /구분코드/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /구분명/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '분류' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: '등록주기' }),
    ).toBeInTheDocument();
  });

  it('opens editor page when document status icon is clicked', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: '문서 생성 페이지 이동' }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/editor/1');
  });

  it('opens edit dialog from grid action', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    await screen.findByRole('button', { name: '업무 수정' });
    fireEvent.click(screen.getByRole('button', { name: '업무 수정' }));
    expect(
      screen.getByRole('dialog', { name: /업무 수정/ }),
    ).toBeInTheDocument();
  });
});
