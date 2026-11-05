import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../../app/providers/AppProviders.tsx';
import type { TenantTodoCardItem } from "../../../../pages/dashboard/tenant/hooks/useTenantDashboardData.ts";
import { TenantApprovalCard } from "../../../../pages/dashboard/tenant/sections/TenantApprovalCard.tsx";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

const item: TenantTodoCardItem = {
    id: '101',
    approvalId: '9001',
    routeIdType: 'approval',
    routeId: '9001',
    dDay: 'D-1',
    unwrittenCount: 0,
    inProgressCycleCount: 0,
    approvedCycleCount: 0,
    rejectedCycleCount: 0,
    title: '결재 제목',
    category: '기타일지',
    status: 'IN_PROGRESS',
    updatedBy: '-',
    updatedAt: '',
    writtenInCycle: true,
    tenantCode: 'PLATFORM',
    categoryGroupId: '10',
    categoryCode: 'ETC',
    categoryName: '기타일지',
    categorySortOrder: 1,
    divisionCode: '016',
    divisionName: '표면오염도 검사성적서',
    cycle: 'WEEK',
    cycleName: '주간',
    active: true,
    expirationApply: false,
    approvalApply: true,
    assigneeIds: [],
    referenceIds: [],
    assigneeMapped: true,
    hasDocument: true,
    createdBy: '홍수미',
    approvalRequestLabel: '승인요청',
    submittedAt: '2026-08-21 18:22',
};

function renderCard(overrides: Partial<TenantTodoCardItem> = {}) {
    render(
        <AppProviders>
            <TenantApprovalCard item={{ ...item, ...overrides }} sectionLabel="기타일지" />
        </AppProviders>,
    );
}

describe('TenantApprovalCard', () => {
    beforeEach(() => navigateMock.mockReset());

    it('shows the request type, drafter, submitted time and chips', () => {
        renderCard();

        expect(screen.getByText('기타일지 | 승인요청')).toBeInTheDocument();
        expect(screen.getByText('표면오염도 검사성적서')).toBeInTheDocument();
        expect(screen.getByText('기안자 : 홍수미')).toBeInTheDocument();
        expect(screen.getByText('작성시간 : 26.08.21 18:22')).toBeInTheDocument();
        expect(screen.getByText('주간')).toBeInTheDocument();
        expect(screen.getByText('D-1')).toBeInTheDocument();
    });

    it('omits the D-day chip and falls back to - for missing values', () => {
        renderCard({ dDay: '', createdBy: undefined, submittedAt: undefined, approvalRequestLabel: undefined });

        expect(screen.queryByText('D-1')).not.toBeInTheDocument();
        expect(screen.getByText('기타일지')).toBeInTheDocument();
        expect(screen.getByText('기안자 : -')).toBeInTheDocument();
        expect(screen.getByText('작성시간 : -')).toBeInTheDocument();
    });

    it('opens the approval document with the pencil button', () => {
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: '결재 문서 열기' }));

        expect(navigateMock).toHaveBeenCalledWith('/approvals/draft/9001?idType=approval');
    });
});