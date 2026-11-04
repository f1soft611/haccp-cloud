import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers/AppProviders.tsx';
import { TenantStatusCardSection } from '../../../pages/dashboard/tenant/sections/TenantStatusCardSection.tsx';

const counts = { 미작성: 4, 결재할문서: 2, 결재진행중: 1, 승인: 7, 반려: 0 };

describe('TenantStatusCardSection', () => {
    it('shows a count per status and reports the clicked status', () => {
        const onSelect = vi.fn();
        render(
            <AppProviders>
                <TenantStatusCardSection
                    counts={counts}
                    isLoading={false}
                    onSelect={onSelect}
                />
            </AppProviders>,
        );

        const approvalWaiting = screen.getByRole('button', { name: /결재할문서/ });
        expect(approvalWaiting).toHaveTextContent('2');
        // 기존 -> 승인 칸이 aria-pressed=true 인지 확인
        // 변경 -> 클릭하면 페이지를 이동하므로 선택 표시 없음
        expect(screen.getByRole('button', { name: /승인/ })).not.toHaveAttribute('aria-pressed');

        fireEvent.click(approvalWaiting);
        expect(onSelect).toHaveBeenCalledWith('결재할문서');
    });

    it('renders each status as one row cell with a 건 unit', () => {
        render(
            <AppProviders>
                <TenantStatusCardSection
                    counts={counts}
                    isLoading={false}
                    onSelect={vi.fn()}
                />
            </AppProviders>,
        );

        expect(screen.getByRole('button', { name: /미작성/ })).toHaveTextContent('미작성4건');
        expect(screen.getByRole('button', { name: /반려/ })).toHaveTextContent('반려0건');
    });
});