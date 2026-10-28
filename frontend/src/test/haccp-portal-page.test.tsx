import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpPortalPage } from '../pages/documents/portal/HaccpPortalPage';
import { useAuthStore } from '../shared/store/authStore';

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

const { listHaccpPortalDocumentsMock } = vi.hoisted(() => ({
  listHaccpPortalDocumentsMock: vi.fn(async () => [
    {
      id: '1',
      categoryName: 'HACCP(선행)',
      divisionName: '위생교육일지-품질',
      cycle: 'MONTH', cycleName: '월',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '2',
      categoryName: 'HACCP(HA)',
      divisionName: 'CCP-1B 검증기록',
      cycle: 'DAY', cycleName: '일',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '3',
      categoryName: '기타문서',
      divisionName: '기안서',
      cycle: 'ANYTIME', cycleName: '수시',
      assigneeSummary: '관리자 외 2명',
    },
    {
      id: '4',
      categoryName: '생산일지',
      divisionName: '생산일지 점검표',
      cycle: 'WEEK', cycleName: '주',
      assigneeSummary: '관리자 외 2명',
    },
  ]),
}));

vi.mock('../services/documents/haccpPortalService', () => ({
  listHaccpPortalDocuments: listHaccpPortalDocumentsMock,
}));

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

describe('HaccpPortalPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getHaccpWorkDraftTemplateMock.mockReset();
    getHaccpWorkDraftTemplateMock.mockResolvedValue({});
    vi.mocked(listHaccpPortalDocumentsMock).mockReset();
    vi.mocked(listHaccpPortalDocumentsMock).mockResolvedValue([
      {
        id: '1',
        categoryName: 'HACCP(선행)',
        divisionName: '위생교육일지-품질',
        cycle: 'MONTH', cycleName: '월',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '2',
        categoryName: 'HACCP(HA)',
        divisionName: 'CCP-1B 검증기록',
        cycle: 'DAY', cycleName: '일',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '3',
        categoryName: '기타문서',
        divisionName: '기안서',
        cycle: 'ANYTIME', cycleName: '수시',
        assigneeSummary: '관리자 외 2명',
      },
      {
        id: '4',
        categoryName: '생산일지',
        divisionName: '생산일지 점검표',
        cycle: 'WEEK', cycleName: '주',
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
      screen.getByTestId('haccp-portal-grid-skeleton-row-0'),
    ).toBeInTheDocument();
  });

  it('renders grid rows with category names', async () => {
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

  it('filters rows by keyword on search', async () => {
    render(
      <AppProviders>
        <HaccpPortalPage />
      </AppProviders>,
    );

    expect(await screen.findByText('기안서')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('구분명, 담당자 검색'), {
      target: { value: 'CCP' },
    });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('CCP-1B 검증기록')).toBeInTheDocument();
    expect(screen.queryByText('기안서')).not.toBeInTheDocument();
  });

  it('filters rows by cycle code from common codes', async () => {
    render(
        <AppProviders>
          <HaccpPortalPage />
        </AppProviders>,
    );

    expect(await screen.findByText('기안서')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '주' }));
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('생산일지 점검표')).toBeInTheDocument();
    expect(screen.queryByText('기안서')).not.toBeInTheDocument();
  });

  it('navigates to draft write page when write button is clicked', async () => {
    render(
        <AppProviders>
          <HaccpPortalPage />
        </AppProviders>,
    );

    expect(await screen.findByText('위생교육일지-품질')).toBeInTheDocument();
    fireEvent.click(
        screen.getAllByRole('button', { name: '작성하러 가기' })[0],
    );

    // 포탈 경로를 returnTo로 함께 넘김
    const returnTo = `${window.location.pathname}${window.location.search}`;
    // 기존 -> 클릭 즉시 이동 / 변경 -> 임시저장 조회 후 이동
    await waitFor(() =>
        expect(navigateMock).toHaveBeenCalledWith(
            `/approvals/draft/1?idType=work&returnTo=${encodeURIComponent(returnTo)}`,
        ),
    );
  });

  it('asks to load the temp-saved document and opens it on confirm', async () => {
    getHaccpWorkDraftTemplateMock.mockResolvedValue({
      approvalId: '9001',
      approvalStatusType: 'pre_apply',
    });
    render(
        <AppProviders>
          <HaccpPortalPage />
        </AppProviders>,
    );

    expect(await screen.findByText('위생교육일지-품질')).toBeInTheDocument();
    fireEvent.click(
        screen.getAllByRole('button', { name: '작성하러 가기' })[0],
    );

    expect(
        await screen.findByText('임시저장된 문서를 불러오시겠습니까?'),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    const returnTo = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
    );
    expect(navigateMock).toHaveBeenCalledWith(
        `/approvals/draft/9001?idType=approval&returnTo=${returnTo}`,
    );
  });

  it('opens a fresh document when declining to load the temp-saved one', async () => {
    getHaccpWorkDraftTemplateMock.mockResolvedValue({
      approvalId: '9001',
      approvalStatusType: 'pre_apply',
    });
    render(
        <AppProviders>
          <HaccpPortalPage />
        </AppProviders>,
    );

    expect(await screen.findByText('위생교육일지-품질')).toBeInTheDocument();
    fireEvent.click(
        screen.getAllByRole('button', { name: '작성하러 가기' })[0],
    );
    fireEvent.click(await screen.findByRole('button', { name: '아니오' }));

    const returnTo = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
    );
    expect(navigateMock).toHaveBeenCalledWith(
        `/approvals/draft/1?idType=work&fresh=true&returnTo=${returnTo}`,
    );
  });
});
