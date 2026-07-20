import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpDocumentManagementPage } from '../pages/documents/haccp-doc/HaccpDocumentManagementPage';
import { listHaccpDocuments } from '../services/documents/haccpDocumentService';
import { useAuthStore } from '../shared/store/authStore';

vi.mock('../services/documents/haccpDocumentService', () => ({
  listHaccpDocuments: vi.fn(),
}));

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('HaccpDocumentManagementPage', () => {
  beforeEach(() => {
    vi.mocked(listHaccpDocuments).mockReset();
    vi.mocked(listHaccpDocuments).mockResolvedValue([
      {
        id: '1',
        workType: 'HACCP (HA)',
        draftNumber: 'HA-202607-001',
        title: '원재료 입고 점검일지',
        writer: '고대성',
        status: '결재중',
        draftedAt: '2026-07-19',
        updatedAt: '2026-07-20 09:12',
      },
      {
        id: '2',
        workType: 'HACCP (선별)',
        draftNumber: 'SE-202607-014',
        title: '선별공정 CCP 점검표',
        writer: '금도연',
        status: '승인',
        draftedAt: '2026-07-16',
        updatedAt: '2026-07-16 15:40',
      },
    ]);

    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      displayName: '플랫폼관리자',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  it('applies query parameters to initial filters', async () => {
    window.history.pushState(
      {},
      '',
      '/docs/haccp-doc?workType=HACCP%20(HA)&draftNumber=HA-202607-001&title=%EC%A0%90%EA%B2%80&writer=%EA%B3%A0%EB%8C%80%EC%84%B1&status=%EA%B2%B0%EC%9E%AC%EC%A4%91&startDate=2026-07-01&endDate=2026-07-20',
    );

    render(
      <AppProviders>
        <HaccpDocumentManagementPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', { name: 'HACCP 문서관리' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('기안번호')).toHaveValue('HA-202607-001');
    expect(screen.getByLabelText('제목')).toHaveValue('점검');
    expect(screen.getByLabelText('작성자')).toHaveValue('고대성');
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-07-01');
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-07-20');
    expect(
      screen.getByRole('combobox', { name: '업무구분' }),
    ).toHaveTextContent('HACCP (HA)');

    await waitFor(() => {
      expect(listHaccpDocuments).toHaveBeenCalledWith({
        tenantCode: 'TENANT-A',
        workType: 'HACCP (HA)',
        draftNumber: 'HA-202607-001',
        title: '점검',
        writer: '고대성',
        status: '결재중',
        startDate: '2026-07-01',
        endDate: '2026-07-20',
      });
    });
  });

  it('uses current month range when query dates are not provided', async () => {
    const now = new Date();
    const expectedStartDate = formatDate(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
    const expectedEndDate = formatDate(now);
    window.history.pushState({}, '', '/docs/haccp-doc');

    render(
      <AppProviders>
        <HaccpDocumentManagementPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', { name: 'HACCP 문서관리' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('시작일')).toHaveValue(expectedStartDate);
    expect(screen.getByLabelText('종료일')).toHaveValue(expectedEndDate);

    await waitFor(() => {
      expect(listHaccpDocuments).toHaveBeenCalled();
    });
  });

  it('shows all documents for admin roles', async () => {
    window.history.pushState({}, '', '/docs/haccp-doc');

    render(
      <AppProviders>
        <HaccpDocumentManagementPage />
      </AppProviders>,
    );

    expect(await screen.findByText('원재료 입고 점검일지')).toBeInTheDocument();
    expect(screen.getByText('선별공정 CCP 점검표')).toBeInTheDocument();
  });

  it('does not send writer filter for non-admin users', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'worker01',
      displayName: '고대성',
      role: 'USER',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
    window.history.pushState({}, '', '/docs/haccp-doc');

    render(
      <AppProviders>
        <HaccpDocumentManagementPage />
      </AppProviders>,
    );

    expect(screen.getByLabelText('작성자')).toBeDisabled();

    await waitFor(() => {
      expect(listHaccpDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          writer: undefined,
        }),
      );
    });
  });
});
