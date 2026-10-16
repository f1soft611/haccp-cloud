import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders';
import { CommonCodePage } from '../../pages/basicinfo/common-code/CommonCodePage';
import { useAuthStore, type UserRole } from '../../shared/store/authStore';

function renderPage(role: UserRole) {
    useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: role === 'PLATFORM_ADMIN' ? 'PLATFORM' : 'TENANT-A',
        userId: 'tester',
        displayName: '테스터',
        role,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
    });
    render(
        <AppProviders>
            <CommonCodePage />
        </AppProviders>,
    );
}

describe('CommonCodePage', () => {
    it('그룹 목록을 보여주고 첫 그룹을 선택한다', async () => {
        renderPage('TENANT_ADMIN');
        expect(await screen.findByText('단위')).toBeInTheDocument();
        expect(screen.getByText('선택 그룹: 기안양식 등록주기')).toBeInTheDocument();
        expect(screen.getByText('DAY')).toBeInTheDocument();
    });

    it('그룹을 클릭하면 상세가 바뀐다', async () => {
        renderPage('TENANT_ADMIN');
        fireEvent.click(await screen.findByText('단위'));
        expect(screen.getByText('선택 그룹: 단위')).toBeInTheDocument();
        expect(screen.getByText('KG')).toBeInTheDocument();
        expect(screen.queryByText('DAY')).not.toBeInTheDocument();
    });

    it('업체 사용자에게는 그룹 관리 버튼이 없다', async () => {
        renderPage('TENANT_ADMIN');
        await screen.findByText('단위');
        expect(screen.queryByRole('button', { name: '그룹 추가' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '그룹 삭제' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '그룹 저장' })).not.toBeInTheDocument();
    });

    it('플랫폼관리자는 그룹 추가 후 저장하면 필수값 오류를 본다', async () => {
        renderPage('PLATFORM_ADMIN');
        await screen.findByText('단위');
        fireEvent.click(screen.getByRole('button', { name: '그룹 추가' }));
        fireEvent.click(screen.getByRole('button', { name: '그룹 저장' }));
        expect(await screen.findByText('신규 그룹: 그룹코드를 입력하세요.')).toBeInTheDocument();
    });

    it('상세는 삭제 버튼이 없고, 추가 후 저장하면 필수값 오류를 본다', async () => {
        renderPage('TENANT_ADMIN');
        await screen.findByText('DAY');
        expect(screen.queryByRole('button', { name: '상세 삭제' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: '상세 저장' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: '상세 추가' }));
        fireEvent.click(screen.getByRole('button', { name: '상세 저장' }));
        expect(await screen.findByText('WF_FORM_CYCLE: 상세코드를 입력하세요.')).toBeInTheDocument();
    });

    it('검색어와 일치하는 그룹만 보여준다', async () => {
        renderPage('TENANT_ADMIN');
        await screen.findByText('기안양식 등록주기');
        fireEvent.change(screen.getByRole('textbox', { name: '그룹 검색' }), {
            target: { value: 'unit' },
        });
        expect(screen.getByText('단위')).toBeInTheDocument();
        expect(screen.queryByText('기안양식 등록주기')).not.toBeInTheDocument();
    });
});