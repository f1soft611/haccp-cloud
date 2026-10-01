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

    it('샘플 작업지시를 그리드에 보여준다', () => {
        renderPage();
        expect(screen.getByRole('grid')).toBeInTheDocument();
        expect(screen.getByText('배추김치')).toBeInTheDocument();
        expect(screen.getByText('깍두기')).toBeInTheDocument();
    });

    it('신규 행을 비운 채 저장하면 필수값 오류를 보여준다', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '신규' }));
        fireEvent.click(screen.getByRole('button', { name: '저장' }));
        expect(screen.getByText('신규 행: 품명을 입력하세요.')).toBeInTheDocument();
    });

    it('선택한 행을 확인 후 삭제한다', () => {
        renderPage();
        // [0]은 헤더 전체선택, [1]이 첫 행(배추김치)
        fireEvent.click(screen.getAllByRole('checkbox')[1]);
        fireEvent.click(screen.getByRole('button', { name: '삭제' }));
        // ConfirmDialog의 삭제 버튼
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
        expect(screen.queryByText('배추김치')).not.toBeInTheDocument();
        expect(screen.getByText('삭제되었습니다.')).toBeInTheDocument();
    });

    it('품명으로 조회하면 일치하는 행만 보여준다', () => {
        renderPage();
        fireEvent.change(screen.getByRole('textbox', { name: '품명' }), {
            target: { value: '깍두기' },
        });
        fireEvent.click(screen.getByRole('button', { name: '조회' }));
        expect(screen.getByText('깍두기')).toBeInTheDocument();
        expect(screen.queryByText('배추김치')).not.toBeInTheDocument();
    });

    it('결재요청은 준비 중 안내를 보여준다', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '결재요청' }));
        expect(screen.getByText('준비 중인 기능입니다.')).toBeInTheDocument();
    });
});