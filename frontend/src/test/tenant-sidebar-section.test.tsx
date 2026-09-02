import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { TenantSidebarSection } from '../pages/dashboard/tenant/sections/TenantSidebarSection';

describe('TenantSidebarSection', () => {
    it('calls onOpenCalendar when the calendar shortcut button is clicked', () => {
        const onOpenCalendar = vi.fn();

        render(
            <AppProviders>
                <TenantSidebarSection
                    approvalAlerts={[]}
                    isLoading={false}
                    isError={false}
                    onOpenCalendar={onOpenCalendar}
                />
            </AppProviders>,
        );

        fireEvent.click(screen.getByRole('button', { name: '캘린더 보기' }));

        expect(onOpenCalendar).toHaveBeenCalledTimes(1);
    });

    it('renders the calendar card above the approval alerts and notice cards', () => {
        render(
            <AppProviders>
                <TenantSidebarSection
                    approvalAlerts={[]}
                    isLoading={false}
                    isError={false}
                    onOpenCalendar={() => {}}
                />
            </AppProviders>,
        );

        const headings = screen.getAllByRole('heading', { level: 6 });
        const headingTexts = headings.map((heading) => heading.textContent);

        expect(headingTexts).toEqual(['업무 캘린더', '결재 알림', '공지사항']);
    });
});