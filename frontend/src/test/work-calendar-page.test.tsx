import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { WorkCalendarPage } from '../pages/documents/work-calendar/WorkCalendarPage';
import {listHaccpWorkTodoCycles, listHaccpWorkTodos} from '../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../shared/store/authStore';
import { getWorkCycleSx } from '../pages/dashboard/tenant/utils';
import { getCommonCodes } from '../services/basicinfo/commonCodeService';

vi.mock('../services/basicinfo/commonCodeService', () => ({
    getCommonCodes: vi.fn(),
}));

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
    listHaccpWorkTodoCycles: vi.fn(),
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
                divisionName: '월간 점검 업무',
                cycle: 'MONTH', cycleName: '월',
                title: '월간 점검 업무',
                active: true,
                expirationApply: false,
                approvalApply: true,
                assigneeIds: [],
                referenceIds: [],
                assigneeMapped: true,
                hasDocument: true,
                writtenInCycle: false,
            },
        ]);
        vi.mocked(listHaccpWorkTodoCycles).mockReset();
        vi.mocked(getCommonCodes).mockResolvedValue({
            groups: [],
            details: [
                { groupCode: 'WF_FORM_CYCLE', code: 'DAY', codeName: '일간', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
                { groupCode: 'WF_FORM_CYCLE', code: 'WEEK', codeName: '주간', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
                { groupCode: 'WF_FORM_CYCLE', code: 'MONTH', codeName: '월간', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '' },
                { groupCode: 'WF_FORM_CYCLE', code: 'YEAR', codeName: '연간', parentCodeName: '', useAt: true, sortOrder: 60, codeDesc: '' },
            ],
        });
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

        // 기존 -> '/approvals/draft/wc-1?idType=work'
        // 변경 -> 이번 달 월주기 기준일(1일)을 cycleDate로 붙임
        const now = new Date();
        const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        expect(navigateMock).toHaveBeenCalledWith(
            `/approvals/draft/wc-1?idType=work&cycleDate=${firstDay}`,
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

    it('colors the event pill background by the todo cycle', async () => {
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        const eventText = await screen.findByText('월간 점검 업무');
        const eventEl = eventText.closest('.rbc-event') as HTMLElement | null;

        expect(eventEl).not.toBeNull();
        expect(eventEl?.style.backgroundColor).toBe(
            getWorkCycleSx('MONTH').bgcolor,
        );
    });

    it('renders a legend with common-code cycle names and status badges', async () => {
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        await waitFor(() => {
            const chipLabels = Array.from(
                document.querySelectorAll('.MuiChip-label'),
            ).map((el) => el.textContent);
            expect(chipLabels).toEqual(['일간', '주간', '월간', '연간']);
        });
        const legendBadges = Array.from(
            document.querySelectorAll('[data-legend] [data-status-badge]'),
        ).map((el) => el.textContent);
        expect(legendBadges).toEqual(['임시저장', '결재중', '반려', '승인']);
    });

    it('falls back to cycle codes when common codes fail to load', async () => {
        vi.mocked(getCommonCodes).mockRejectedValue(new Error('fail'));
        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        await screen.findByText('월간 점검 업무');
        const chipLabels = Array.from(
            document.querySelectorAll('.MuiChip-label'),
        ).map((el) => el.textContent);
        expect(chipLabels).toEqual(['DAY', 'WEEK', 'MONTH', 'YEAR']);
    });

    it('shows status badges for temp-saved, in-progress and rejected and approved', async () => {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const base = {
            tenantCode: 'TENANT-A', categoryGroupId: '10', categoryCode: 'HA',
            categoryName: 'HACCP (HA)', categorySortOrder: 1, divisionCode: '001',
            divisionName: '점검', cycle: 'MONTH', cycleName: '월', active: true,
            expirationApply: false, approvalApply: true,
            assigneeIds: [], referenceIds: [], assigneeMapped: true, hasDocument: true,
            writtenInCycle: false,
        };
        vi.mocked(listHaccpWorkTodos).mockResolvedValue([
            { ...base, id: 'a', title: '임시저장 업무' },
            { ...base, id: 'b', title: '결재중 업무' },
            { ...base, id: 'c', title: '반려 업무' },
            { ...base, id: 'd', title: '승인 업무' },
        ]);
        // 기존 -> mockResolvedValue([...인스턴스])
        // 변경 -> instances + displayStartDate
        vi.mocked(listHaccpWorkTodoCycles).mockResolvedValue({
            displayStartDate: '',
            instances: [
                { workId: 'a', cycleDate: `${ym}-01`, approvalId: '1', statusType: 'pre_apply', registeredDate: `${ym}-01`, title: '임시저장 업무' },
                { workId: 'b', cycleDate: `${ym}-01`, approvalId: '2', statusType: 'in_progress', registeredDate: `${ym}-01`, title: '결재중 업무' },
                { workId: 'c', cycleDate: `${ym}-01`, approvalId: '3', statusType: 'rejected', registeredDate: `${ym}-01`, title: '반려 업무' },
                { workId: 'd', cycleDate: `${ym}-01`, approvalId: '4', statusType: 'approved', registeredDate: `${ym}-01`, title: '승인 업무' },
            ],
        });

        render(
            <AppProviders>
                <WorkCalendarPage />
            </AppProviders>,
        );

        const badgeOf = (title: string) =>
            screen.getByText(title)
            .closest('.rbc-event')
            ?.querySelector('[data-status-badge]')?.textContent ?? null;

        // 기존 -> '임시저장' / '결재중' / '반려'
        // 변경 -> 이벤트 배지는 한 글자
        await waitFor(() => expect(badgeOf('임시저장 업무')).toBe('임'));
        expect(badgeOf('결재중 업무')).toBe('중');
        expect(badgeOf('반려 업무')).toBe('반');
        expect(badgeOf('승인 업무')).toBe('승');
    });
});