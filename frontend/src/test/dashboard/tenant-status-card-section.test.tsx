import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { TenantStatusCardSection } from '../../pages/dashboard/tenant/sections/TenantStatusCardSection';

const counts = { 미작성: 4, 결재대기중: 2, 결재진행중: 1, 승인: 7, 반려: 0 };

describe('TenantStatusCardSection', () => {
    it('shows a count per status and reports the clicked status', () => {
        const onSelect = vi.fn();
        render(
            <AppProviders>
                <TenantStatusCardSection
                    counts={counts}
                    selected="승인"
                    isLoading={false}
                    onSelect={onSelect}
                />
            </AppProviders>,
        );

        const approvalWaiting = screen.getByRole('button', { name: /결재대기중/ });
        expect(approvalWaiting).toHaveTextContent('2');
        expect(screen.getByRole('button', { name: /승인/ })).toHaveAttribute(
            'aria-pressed',
            'true',
        );

        fireEvent.click(approvalWaiting);
        expect(onSelect).toHaveBeenCalledWith('결재대기중');
    });
});