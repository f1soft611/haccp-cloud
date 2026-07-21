import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('TenantTodoSection', () => {
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
                  cycle: '월',
                  active: true,
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

  it('opens work draft route when not written in current cycle even if approval id exists', () => {
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
                  cycle: '월',
                  active: true,
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

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(String(navigateMock.mock.calls[0]?.[0] || '')).toBe(
      '/approvals/draft/101?idType=work',
    );
  });

  it('opens approval draft route when written in current cycle and approval id exists', () => {
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
                  cycle: '월',
                  active: true,
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

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(String(navigateMock.mock.calls[0]?.[0] || '')).toBe(
      '/approvals/draft/9001?idType=approval',
    );
  });
});
