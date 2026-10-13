import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { WorkOrderPage } from '../pages/documents/work-order/WorkOrderPage';
import { useAuthStore } from '../shared/store/authStore';

function renderPage() {
    render(
        <AppProviders>
            <WorkOrderPage />
        </AppProviders>,
    );
}

describe('WorkOrderPage', () => {
    beforeEach(() => {
        useAuthStore.setState({
            isAuthenticated: true,
            tenantCode: 'TENANT-A',
            userId: 'tenant_admin',
            displayName: '테넌트관리자',
            role: 'TENANT_ADMIN',
            onboardingRequired: false,
            onboardingStatus: 'COMPLETED',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('샘플 작업지시를 테이블과 총 건수로 보여준다', () => {
        renderPage();
        const table = screen.getByRole('table', { name: '작업지시 목록' });
        expect(within(table).getByText('배추김치')).toBeInTheDocument();
        expect(within(table).getByText('깍두기')).toBeInTheDocument();
        expect(screen.getByText('총 3건')).toBeInTheDocument();
    });

    it('신규 다이얼로그를 비운 채 저장하면 필드 오류를 보여준다', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '신규' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
        expect(within(dialog).getByText('품명을 입력하세요.')).toBeInTheDocument();
        expect(within(dialog).getByText('생산량은 0보다 커야 합니다.')).toBeInTheDocument();
    });

    it('신규 다이얼로그로 작업지시를 등록한다', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '신규' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/^품명/), { target: { value: '열무김치' } });
        fireEvent.change(within(dialog).getByLabelText(/^생산일자/), { target: { value: '2026-10-01' } });
        fireEvent.change(within(dialog).getByLabelText(/^소비기한/), { target: { value: '2026-10-31' } });
        fireEvent.change(within(dialog).getByLabelText(/^생산량/), { target: { value: '100' } });
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        expect(screen.getByText('등록되었습니다.')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getByText('열무김치')).toBeInTheDocument();
        expect(screen.getByText('총 4건')).toBeInTheDocument();
    });

    it('수정 아이콘으로 작업지시를 수정한다', () => {
        renderPage();
        fireEvent.click(screen.getAllByRole('button', { name: '작업지시 수정' })[0]);
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByLabelText(/^품명/)).toHaveValue('배추김치');
        fireEvent.change(within(dialog).getByLabelText(/^품명/), { target: { value: '백김치' } });
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        expect(screen.getByText('수정되었습니다.')).toBeInTheDocument();
        const table = screen.getByRole('table');
        expect(within(table).getByText('백김치')).toBeInTheDocument();
        expect(within(table).queryByText('배추김치')).not.toBeInTheDocument();
    });

    it('삭제 아이콘으로 확인 후 삭제한다', () => {
        renderPage();
        fireEvent.click(screen.getAllByRole('button', { name: '작업지시 삭제' })[0]);
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
        expect(within(screen.getByRole('table')).queryByText('배추김치')).not.toBeInTheDocument();
        expect(screen.getByText('삭제되었습니다.')).toBeInTheDocument();
    });

    it('품명으로 조회하면 일치하는 행만 보여준다', () => {
        renderPage();
        fireEvent.change(screen.getByRole('textbox', { name: '품명' }), {
            target: { value: '깍두기' },
        });
        fireEvent.click(screen.getByRole('button', { name: '조회' }));
        const table = screen.getByRole('table');
        expect(within(table).getByText('깍두기')).toBeInTheDocument();
        expect(within(table).queryByText('배추김치')).not.toBeInTheDocument();
    });
});