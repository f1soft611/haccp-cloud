import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders';
import { CommonCodePage } from '../../pages/basicinfo/common-code/CommonCodePage';
import { useAuthStore } from '../../shared/store/authStore';

function renderPage() {
    render(
        <AppProviders>
            <CommonCodePage />
        </AppProviders>,
    );
}

describe('CommonCodePage', () => {
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

    it('그룹 목록을 보여주고 첫 그룹을 선택한다', async () => {
        renderPage();
        expect(await screen.findByText('단위')).toBeInTheDocument();
        expect(screen.getByText('선택 그룹: 발생 주기')).toBeInTheDocument();
        expect(screen.getByText('DAY')).toBeInTheDocument();
    });

    it('그룹을 클릭하면 상세가 바뀐다', async () => {
        renderPage();
        fireEvent.click(await screen.findByText('단위'));
        expect(screen.getByText('선택 그룹: 단위')).toBeInTheDocument();
        expect(screen.getByText('KG')).toBeInTheDocument();
        expect(screen.queryByText('DAY')).not.toBeInTheDocument();
    });

    it('그룹 추가 후 저장하면 필수값 오류를 보여준다', async () => {
        renderPage();
        await screen.findByText('발생 주기');
        fireEvent.click(screen.getByRole('button', { name: '그룹 추가' }));
        fireEvent.click(screen.getByRole('button', { name: '저장' }));
        expect(await screen.findByText('신규 그룹: 그룹코드를 입력하세요.')).toBeInTheDocument();
    });

    it('선택한 상세를 확인 후 삭제한다', async () => {
        renderPage();
        const weekRow = (await screen.findByText('WEEK')).closest('[role="row"]') as HTMLElement;
        fireEvent.click(within(weekRow).getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: '상세 삭제' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
        expect(screen.queryByText('WEEK')).not.toBeInTheDocument();
        expect(screen.getByText('DAY')).toBeInTheDocument();
    });

    it('검색어와 일치하는 그룹만 보여준다', async () => {
        renderPage();
        await screen.findByText('발생 주기');
        fireEvent.change(screen.getByRole('textbox', { name: '그룹 검색' }), {
            target: { value: 'unit' },
        });
        expect(screen.getByText('단위')).toBeInTheDocument();
        expect(screen.queryByText('발생 주기')).not.toBeInTheDocument();
    });
});