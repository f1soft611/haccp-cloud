import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DashboardPage } from '../pages/DashboardPage';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';

describe('Dashboard page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  it('renders the tenant admin dashboard with todo, approval alerts, and notices', async () => {
    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    // 기존 -> KPI 카드(kpi-card-ccp-rate) 존재 확인
    // 변경 -> KPI 카드 제거됨, 당일현황 그리드로 렌더링 확인
    expect(
      await screen.findByRole('table', { name: '당일현황' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-card-ccp-rate')).not.toBeInTheDocument();
    // 기존 -> 결재 알림 헤딩 존재 확인
    // 변경 -> 결재 알림 패널 제거됨
    expect(
      screen.queryByRole('heading', { name: '결재 알림' }),
    ).not.toBeInTheDocument();
    expect(
        screen.getByRole('heading', { name: '공지사항' }),
    ).toBeInTheDocument();
    // 기존 -> 사이드바의 업무 캘린더 바로가기 카드 확인
    // 변경 -> 리스트/캘린더 토글로 메인 영역 전환 확인
    expect(screen.queryByTestId('tenant-dashboard-calendar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '캘린더형' }));
    expect(screen.getByTestId('tenant-dashboard-calendar')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: '당일현황' })).not.toBeInTheDocument();
    expect(
        screen.queryByRole('heading', { name: '관리자 허브' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('DOCUMENT MANAGEMENT PORTAL'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('최근 변경 이력')).not.toBeInTheDocument();
  });

  it('renders the platform admin dashboard top section without the legacy login panel', async () => {
    useAuthStore.setState({
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
      planCode: 'P',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(
      await screen.findByTestId('platform-admin-dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByText('자주 찾는 메뉴')).toBeInTheDocument();
    expect(
      screen.queryByText(APP_LABELS.dashboard.platformAdmin.title),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('platform_admin')).not.toBeInTheDocument();
  });
});
