import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { WorkCalendarPage } from '../pages/documents/work-calendar/WorkCalendarPage';
import { listHaccpWorkTodos } from '../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../shared/store/authStore';

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

vi.mock('../services/documents/haccpBaseWorkService', () => ({
    listHaccpWorkTodos: vi.fn(),
}));

describe('WorkCalendarPage', () => {
    beforeEach(() => {
        navigateMock.mockReset();
        useAuthStore.setState({ tenantCode: 'TENANT-A' });
        vi.mocked(listHaccpWorkTodos).mockReset();
        vi.mocked(listHaccpWorkTodos).mockResolvedValue([
            {
                id: 'wc-1',
                tenantCode: 'TENANT-A',
                categoryGroupId: '10',
                categoryCode: 'HA',
                categoryName: 'HACCP (HA)',
                categorySortOrder: 1,
                divisionCode: '001',
                divisionName: '월간 점검',
                cycle: '월간',
                title: '월간 점검 업무',
                active: true,
                assigneeIds: [],
                referenceIds: [],
                assigneeMapped: true,
                hasDocument: true,
                writtenInCycle: false,
            },
        ]);
    });

    it('shows the current month label and the monthly-cycle todo', async () => {
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        const now = new Date();
        expect(
            await screen.findByText(
                `${now.getFullYear()}년 ${now.getMonth() + 1}월`,
            ),
        ).toBeInTheDocument();
        expect(await screen.findByText('월간 점검 업무')).toBeInTheDocument();
    });

    it('navigates to the work draft route when a todo is clicked', async () => {
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        fireEvent.click(await screen.findByText('월간 점검 업무'));

        await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1));
        expect(navigateMock).toHaveBeenCalledWith(
            '/approvals/draft/wc-1?idType=work',
        );
    });

    it('advances to next month label when clicking the next-month button', async () => {
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        const now = new Date();
        await screen.findByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`);

        fireEvent.click(screen.getByLabelText('다음 달'));

        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        expect(
            await screen.findByText(
                `${next.getFullYear()}년 ${next.getMonth() + 1}월`,
            ),
        ).toBeInTheDocument();
    });
});