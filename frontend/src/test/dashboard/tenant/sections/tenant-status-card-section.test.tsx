import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../../app/providers/AppProviders.tsx';
import { TenantStatusCardSection } from '../../../../pages/dashboard/tenant/sections/TenantStatusCardSection';

const counts = { 미작성: 4, 결재할문서: 2, 결재진행중: 1, 승인: 7, 반려: 0 };

function renderBar(overrides: Partial<Parameters<typeof TenantStatusCardSection>[0]> = {}) {
    const props = {
        counts,
        isLoading: false,
        onSelect: vi.fn(),
        docScope: 'all' as const,
        onDocScopeChange: vi.fn(),
        viewMode: 'list' as const,
        onViewModeChange: vi.fn(),
        ...overrides,
    };
    render(
        <AppProviders>
            <TenantStatusCardSection {...props} />
        </AppProviders>,
    );
    return props;
}

describe('TenantStatusCardSection', () => {
    it('shows a count per status with a 건 unit', () => {
        renderBar();

        expect(screen.getByRole('button', { name: /미작성/ })).toHaveTextContent('미작성4건');
        expect(screen.getByRole('button', { name: /결재진행중/ })).toHaveTextContent('결재진행중1건');
        expect(screen.getByRole('button', { name: /승인/ })).toHaveTextContent('승인7건');
        expect(screen.getByRole('button', { name: /반려/ })).toHaveTextContent('반려0건');
        expect(screen.getByRole('button', { name: /결재할 문서/ })).toHaveTextContent('결재할 문서2건');
    });

    it('reports the clicked status', () => {
        const { onSelect } = renderBar();

        fireEvent.click(screen.getByRole('button', { name: /결재할 문서/ }));
        expect(onSelect).toHaveBeenCalledWith('결재할문서');

        fireEvent.click(screen.getByRole('button', { name: /미작성/ }));
        expect(onSelect).toHaveBeenCalledWith('미작성');
    });

    it('reports the selected document scope', () => {
        const { onDocScopeChange } = renderBar();

        expect(screen.getByRole('radio', { name: '전체' })).toBeChecked();
        fireEvent.click(screen.getByRole('radio', { name: '결재할문서' }));

        expect(onDocScopeChange).toHaveBeenCalledWith('approval');
    });

    it('disables the radios but keeps the counts in the calendar view', () => {
        renderBar({ viewMode: 'calendar', docScope: 'draft' });

        ['전체', '기안문서', '결재할문서'].forEach((name) => {
            expect(screen.getByRole('radio', { name })).toBeDisabled();
        });
        expect(screen.getByRole('radio', { name: '기안문서' })).toBeChecked();
        expect(screen.getByRole('button', { name: /미작성/ })).toBeEnabled();
    });

    it('reports the view mode change', () => {
        const { onViewModeChange } = renderBar();

        fireEvent.click(screen.getByRole('button', { name: '캘린더형' }));

        expect(onViewModeChange).toHaveBeenCalledWith('calendar');
    });

it('shows the selected and unselected radio dots in the design colors', () => {
    renderBar({ docScope: 'all' });

    const dotOf = (name: string) =>
        screen
            .getByRole('radio', { name })
            .closest('.MuiRadio-root')
            ?.querySelector('[data-testid="doc-scope-radio-dot"]');

    expect(dotOf('전체')).toHaveStyle({ backgroundColor: '#375ACE' });
    expect(dotOf('기안문서')).toHaveStyle({ backgroundColor: '#D5DBEF' });
});
});