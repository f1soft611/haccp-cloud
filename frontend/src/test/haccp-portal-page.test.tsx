import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpPortalPage } from '../pages/documents/portal/HaccpPortalPage';
import { useAuthStore } from '../shared/store/authStore';

const { listHaccpPortalDocumentsMock } = vi.hoisted(() => ({
  listHaccpPortalDocumentsMock: vi.fn(async () => [
    {
      id: '1',
      categoryName: 'HACCP(선행)',
      divisionName: '위생교육일지-품질',
      cycle: '월',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '2',
      categoryName: 'HACCP(HA)',
      divisionName: 'CCP-1B 검증기록',
      cycle: '일',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '3',
      categoryName: '기타문서',
      divisionName: '기안서',
      cycle: '발생시',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '4',
      categoryName: '생산일지',
      divisionName: '생산일지 점검표',
      cycle: '주',
      assigneeSummary: '관리자 외 2명',
    },
  ]),
}));

vi.mock('../services/documents/haccpPortalService', () => ({
  listHaccpPortalDocuments: listHaccpPortalDocumentsMock,
}));

describe('HaccpPortalPage', () => {
  beforeEach(() => {
    vi.mocked(listHaccpPortalDocumentsMock).mockReset();
    vi.mocked(listHaccpPortalDocumentsMock).mockResolvedValue([
      {
        id: '1',
        categoryName: 'HACCP(선행)',
        divisionName: '위생교육일지-품질',
        cycle: '월',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '2',
        categoryName: 'HACCP(HA)',
        divisionName: 'CCP-1B 검증기록',
        cycle: '일',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '3',
        categoryName: '기타문서',
        divisionName: '기안서',
        cycle: '발생시',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '4',
        categoryName: '생산일지',
        divisionName: '생산일지 점검표',
        cycle: '주',
        assigneeSummary: '관리자 외 2명',
      },
    ]);
  });

  it('renders skeleton rows while loading', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-LOADING',
      userId: 'platform_admin',
      displayName: '플랫폼관리자',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    vi.mocked(listHaccpPortalDocumentsMock).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <AppProviders>
        <HaccpPortalPage />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: 'HACCP 문서포탈' }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('haccp-portal-grid-skeleton-0-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('haccp-portal-grid-skeleton-1-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('haccp-portal-grid-skeleton-2-0'),
    ).toBeInTheDocument();
  });

  it('renders dynamic category panels and rows from actual category names', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      displayName: '플랫폼관리자',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    render(
      <AppProviders>
        <HaccpPortalPage />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: 'HACCP 문서포탈' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('위생교육일지-품질')).toBeInTheDocument();
    expect(screen.getByText('HACCP(선행)')).toBeInTheDocument();
    expect(screen.getByText('HACCP(HA)')).toBeInTheDocument();
    expect(screen.getByText('기타문서')).toBeInTheDocument();
    expect(screen.getByText('생산일지')).toBeInTheDocument();
    expect(screen.getByText('CCP-1B 검증기록')).toBeInTheDocument();
    expect(screen.getByText('기안서')).toBeInTheDocument();
    expect(screen.getByText('생산일지 점검표')).toBeInTheDocument();
  });
});
