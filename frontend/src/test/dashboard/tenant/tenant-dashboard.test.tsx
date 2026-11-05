import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers/AppProviders.tsx';
import type { WorkCalendarEvent } from '../../../pages/documents/work-calendar/hooks/useWorkCalendarData';
import type { TenantTodoCardItem } from '../../../pages/dashboard/tenant/hooks/useTenantDashboardData';
import { TenantDashboard } from '../../../pages/dashboard/tenant/TenantDashboard';

const baseItem: TenantTodoCardItem = {
    id: '1',
    routeIdType: 'work',
    routeId: '1',
    dDay: '',
    unwrittenCount: 2,
    inProgressCycleCount: 1,
    approvedCycleCount: 3,
    rejectedCycleCount: 0,
    title: '기안 업무',
    category: '기타일지',
    status: 'DRAFT',
    updatedBy: '-',
    updatedAt: '',
    writtenInCycle: false,
    tenantCode: 'PLATFORM',
    categoryGroupId: '10',
    categoryCode: 'ETC',
    categoryName: '기타일지',
    categorySortOrder: 1,
    divisionCode: '001',
    divisionName: '기안 업무',
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

const anytimeItem: TenantTodoCardItem = {
    ...baseItem,
    id: '2',
    routeId: '2',
    title: '수시 업무',
    divisionName: '수시 업무',
    cycle: 'ANYTIME',
    cycleName: '수시',
};

const approvalItem: TenantTodoCardItem = {
    ...baseItem,
    id: '3',
    approvalId: '9001',
    routeId: '9001',
    routeIdType: 'approval',
    title: '결재 업무',
    divisionName: '결재 업무',
    writtenInCycle: true,
    approvalRequestLabel: '승인요청',
};

const toSection = (items: TenantTodoCardItem[]) => [
    { key: 'etc', label: '기타일지', sortOrder: 1, items },
];

const calendarEvents = [
    { resource: baseItem },
    { resource: anytimeItem },
] as WorkCalendarEvent[];

vi.mock('../../../pages/dashboard/tenant/hooks/useTenantDashboardData', () => ({
    useTenantDashboardData: () => ({
        todoSections: toSection([baseItem, anytimeItem]),
        approvalSections: toSection([approvalItem]),
        isTodoLoading: false,
        isTodoError: false,
        isApprovalLoading: false,
        isApprovalError: false,
    }),
}));

vi.mock('../../../pages/documents/work-calendar/hooks/useWorkCalendarData', () => ({
    useWorkCalendarData: () => ({
        events: calendarEvents,
        viewDate: new Date('2026-11-05T00:00:00'),
        setViewDate: vi.fn(),
        workdays: new Map(),
    }),
}));

// 캘린더 본체 대신 전달된 일정 수만 표시
vi.mock('../../../pages/documents/work-calendar/components/WorkCalendarView', () => ({
    WorkCalendarView: ({ events }: { events: unknown[] }) => (
        <div data-testid="calendar">{events.length}</div>
    ),
}));

function renderDashboard() {
    render(
        <AppProviders>
            <TenantDashboard />
        </AppProviders>,
    );
}

describe('TenantDashboard', () => {
    beforeEach(() => window.sessionStorage.clear());

    it('shows both sections for 전체, including 수시 work', () => {
        renderDashboard();

        expect(screen.getByRole('heading', { name: '기안문서' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '결재할문서' })).toBeInTheDocument();
        expect(screen.getByText('기안 업무')).toBeInTheDocument();
        expect(screen.getByText('수시 업무')).toBeInTheDocument();
        expect(screen.getByText('결재 업무')).toBeInTheDocument();
    });

    it('has no search filter', () => {
        renderDashboard();

        expect(screen.queryByRole('button', { name: '조회' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('업무명')).not.toBeInTheDocument();
    });

    it('shows only the selected section', () => {
        renderDashboard();

        fireEvent.click(screen.getByRole('radio', { name: '기안문서' }));
        expect(screen.getByText('기안 업무')).toBeInTheDocument();
        expect(screen.queryByText('결재 업무')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: '결재할문서' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('radio', { name: '결재할문서' }));
        expect(screen.queryByText('기안 업무')).not.toBeInTheDocument();
        expect(screen.getByText('결재 업무')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: '기안문서' })).not.toBeInTheDocument();
    });

    it('keeps the status bar in the calendar view and excludes 수시 by default', () => {
        renderDashboard();

        fireEvent.click(screen.getByRole('button', { name: '캘린더형' }));

        expect(screen.getByTestId('calendar')).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: /미작성/ })).toHaveTextContent('미작성4건');
        expect(screen.getByRole('radio', { name: '전체' })).toBeDisabled();
        expect(screen.queryByText('기안 업무')).not.toBeInTheDocument();
    });

    it('restores the selected scope when returning to the card view', () => {
        renderDashboard();

        fireEvent.click(screen.getByRole('radio', { name: '결재할문서' }));
        fireEvent.click(screen.getByRole('button', { name: '캘린더형' }));
        fireEvent.click(screen.getByRole('button', { name: '카드형' }));

        expect(screen.getByRole('radio', { name: '결재할문서' })).toBeChecked();
        expect(screen.getByText('결재 업무')).toBeInTheDocument();
        expect(screen.queryByText('기안 업무')).not.toBeInTheDocument();
    });
});