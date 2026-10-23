import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { TenantTodoSection } from '../pages/dashboard/tenant/sections/TenantTodoSection';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

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

const { getHaccpWorkDraftTemplateMock } = vi.hoisted(() => ({
  getHaccpWorkDraftTemplateMock: vi.fn(),
}));

vi.mock('../services/documents/haccpBaseWorkService', async () => {
  const actual = await vi.importActual<
      typeof import('../services/documents/haccpBaseWorkService')
  >('../services/documents/haccpBaseWorkService');
  return {
    ...actual,
    getHaccpWorkDraftTemplate: getHaccpWorkDraftTemplateMock,
  };
});

describe('TenantTodoSection', () => {

  beforeEach(() => {
    getHaccpWorkDraftTemplateMock.mockReset();
    getHaccpWorkDraftTemplateMock.mockResolvedValue({});
  });

  it('renders one grid row per todo item with the category repeated', () => {
    const baseItem = {
      routeIdType: 'work' as const,
      category: 'HACCP (HA)',
      status: 'DRAFT' as const,
      updatedBy: '관리자',
      updatedAt: '2026-07-20 09:00',
      writtenInCycle: false,
      tenantCode: 'PLATFORM',
      categoryGroupId: '10',
      categoryCode: 'HA',
      categoryName: 'HACCP (HA)',
      categorySortOrder: 1,
      cycle: 'MONTH', cycleName: '월',
      active: true,
      expirationApply: false,
      approvalApply: true,
      assigneeIds: [],
      referenceIds: [],
      assigneeMapped: true,
      hasDocument: true,
    };

    render(
      <AppProviders>
        <TenantTodoSection
          isLoading={false}
          isError={false}
          sections={[
            {
              key: 'ha',
              label: 'HACCP (HA)',
              sortOrder: 1,
              items: [
                { ...baseItem, id: '1', routeId: '1', title: '점검 A', divisionCode: '001', divisionName: '점검 A' },
                { ...baseItem, id: '2', routeId: '2', title: '점검 B', divisionCode: '002', divisionName: '점검 B' },
              ],
            },
          ]}
        />
      </AppProviders>,
    );

    const grid = screen.getByRole('table', { name: '당일현황' });
    // 헤더 1행 + 데이터 2행
    expect(within(grid).getAllByRole('row')).toHaveLength(3);
    expect(within(grid).getAllByText('HACCP (HA)')).toHaveLength(2);
    expect(within(grid).getByText('점검 A')).toBeInTheDocument();
    expect(within(grid).getByText('점검 B')).toBeInTheDocument();
  });

  it('navigates to haccp document page with work type and current month range', () => {
    navigateMock.mockReset();

    render(
      <AppProviders>
        <TenantTodoSection
          isLoading={false}
          isError={false}
          sections={[
            {
              key: 'ha',
              label: 'HACCP (HA)',
              sortOrder: 1,
              items: [
                {
                  id: '1',
                  routeIdType: 'work',
                  routeId: '1',
                  title: '점검 문서',
                  category: 'HACCP (HA)',
                  status: 'IN_PROGRESS',
                  updatedBy: '관리자',
                  updatedAt: '2026-07-20 09:00',
                  writtenInCycle: false,
                  tenantCode: 'PLATFORM',
                  categoryGroupId: '10',
                  categoryCode: 'HA',
                  categoryName: 'HACCP (HA)',
                  categorySortOrder: 1,
                  divisionCode: '001',
                  divisionName: '점검 문서',
                  cycle: 'MONTH', cycleName: '월',
                  active: true,
                  expirationApply: false,
                  approvalApply: true,
                  assigneeIds: [],
                  referenceIds: [],
                  assigneeMapped: true,
                  hasDocument: true,
                },
              ],
            },
          ]}
        />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '이동' }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const destination = String(navigateMock.mock.calls[0]?.[0] || '');
    expect(destination.startsWith('/docs/haccp-doc?')).toBe(true);

    const queryString = destination.split('?')[1] || '';
    const params = new URLSearchParams(queryString);

    expect(params.get('workType')).toBe('HACCP (HA)');
    expect(params.get('startDate')).toMatch(/^\d{4}-\d{2}-01$/);
    expect(params.get('endDate')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('opens work draft route when not written in current cycle even if approval id exists', async () => {
    navigateMock.mockReset();

    render(
      <AppProviders>
        <TenantTodoSection
          isLoading={false}
          isError={false}
          sections={[
            {
              key: 'ha',
              label: 'HACCP (HA)',
              sortOrder: 1,
              items: [
                {
                  id: '101',
                  approvalId: '9001',
                  routeIdType: 'approval',
                  routeId: '9001',
                  title: '점검 문서',
                  category: 'HACCP (HA)',
                  status: 'DRAFT',
                  updatedBy: '관리자',
                  updatedAt: '2026-07-20 09:00',
                  writtenInCycle: false,
                  tenantCode: 'PLATFORM',
                  categoryGroupId: '10',
                  categoryCode: 'HA',
                  categoryName: 'HACCP (HA)',
                  categorySortOrder: 1,
                  divisionCode: '001',
                  divisionName: '점검 문서',
                  cycle: 'MONTH', cycleName: '월',
                  active: true,
                  expirationApply: false,
                  approvalApply: true,
                  assigneeIds: [],
                  referenceIds: [],
                  assigneeMapped: true,
                  hasDocument: true,
                },
              ],
            },
          ]}
        />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '작성하러 가기' }));

    // 기존 -> 클릭 즉시 이동 / 변경 -> 임시저장 조회 후 이동
    await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1));
    expect(String(navigateMock.mock.calls[0]?.[0] || '')).toBe(
        '/approvals/draft/101?idType=work',
    );
  });

  // 기존 -> 이번 주기 작성 문서가 있으면 그 결재 문서로 이동
  // 변경 -> 같은 주기 여러 건 허용이라 임시저장이 없으면 새 문서 작성 화면
  it('opens work draft route even when written in current cycle', async () => {
    navigateMock.mockReset();

    render(
      <AppProviders>
        <TenantTodoSection
          isLoading={false}
          isError={false}
          sections={[
            {
              key: 'ha',
              label: 'HACCP (HA)',
              sortOrder: 1,
              items: [
                {
                  id: '101',
                  approvalId: '9001',
                  routeIdType: 'work',
                  routeId: '101',
                  title: '점검 문서',
                  category: 'HACCP (HA)',
                  status: 'IN_PROGRESS',
                  updatedBy: '관리자',
                  updatedAt: '2026-07-20 09:00',
                  writtenInCycle: true,
                  tenantCode: 'PLATFORM',
                  categoryGroupId: '10',
                  categoryCode: 'HA',
                  categoryName: 'HACCP (HA)',
                  categorySortOrder: 1,
                  divisionCode: '001',
                  divisionName: '점검 문서',
                  cycle: 'MONTH', cycleName: '월',
                  active: true,
                  expirationApply: false,
                  approvalApply: true,
                  assigneeIds: [],
                  referenceIds: [],
                  assigneeMapped: true,
                  hasDocument: true,
                },
              ],
            },
          ]}
        />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '작성하러 가기' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1));
    expect(String(navigateMock.mock.calls[0]?.[0] || '')).toBe(
        '/approvals/draft/101?idType=work',
    );
  });

  const writtenItem = {
    id: '101',
    approvalId: '9001',
    routeIdType: 'approval' as const,
    routeId: '9001',
    title: '점검 문서',
    category: 'HACCP (HA)',
    status: 'IN_PROGRESS' as const,
    updatedBy: '관리자',
    updatedAt: '2026-07-20 09:00',
    writtenInCycle: true,
    tenantCode: 'PLATFORM',
    categoryGroupId: '10',
    categoryCode: 'HA',
    categoryName: 'HACCP (HA)',
    categorySortOrder: 1,
    divisionCode: '001',
    divisionName: '점검 문서',
    cycle: 'MONTH',
    cycleName: '월',
    active: true,
    expirationApply: false,
    approvalApply: true,
    assigneeIds: [],
    referenceIds: [],
    assigneeMapped: true,
    hasDocument: true,
  };

  it('asks to load the temp-saved document and opens a fresh one on decline', async () => {
    navigateMock.mockReset();
    getHaccpWorkDraftTemplateMock.mockResolvedValue({
      approvalId: '9001',
      approvalStatusType: 'pre_apply',
    });

    render(
        <AppProviders>
          <TenantTodoSection
              isLoading={false}
              isError={false}
              sections={[{ key: 'ha', label: 'HACCP (HA)', sortOrder: 1, items: [writtenItem] }]}
          />
        </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '작성하러 가기' }));
    expect(
        await screen.findByText('임시저장된 문서를 불러오시겠습니까?'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '아니오' }));

    expect(navigateMock).toHaveBeenCalledWith(
        '/approvals/draft/101?idType=work&fresh=true',
    );
  });

  it('keeps opening the approval document in the pending approval tab', () => {
    navigateMock.mockReset();

    render(
        <AppProviders>
          <TenantTodoSection
              isLoading={false}
              isError={false}
              pendingApproval
              sections={[{ key: 'ha', label: 'HACCP (HA)', sortOrder: 1, items: [writtenItem] }]}
          />
        </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: '작성하러 가기' }));

    expect(getHaccpWorkDraftTemplateMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(
        '/approvals/draft/9001?idType=approval',
    );
  });
});
