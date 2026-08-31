import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, afterEach } from 'vitest';
import { appTheme } from '../app/theme';
import { AccountPasswordPage } from '../pages/account/AccountPasswordPage';
import { useAuthStore } from '../shared/store/authStore';

function renderPage() {
    const queryClient = new QueryClient();

    render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={appTheme}>
                <MemoryRouter>
                    <AccountPasswordPage />
                </MemoryRouter>
            </ThemeProvider>
        </QueryClientProvider>,
    );
}

describe('AccountPasswordPage', () => {
    afterEach(() => {
        useAuthStore.setState({
            isAuthenticated: false,
            userId: '',
            displayName: '',
            role: 'USER',
        });
    });

    it('rejects a new password that contains the login id', () => {
        useAuthStore.setState({
            isAuthenticated: true,
            userId: 'hong123',
            displayName: '홍길동',
            role: 'USER',
        });

        renderPage();

        fireEvent.change(screen.getByLabelText('현재 비밀번호'), {
            target: { value: 'oldPassword1' },
        });
        fireEvent.change(screen.getByLabelText('새 비밀번호'), {
            target: { value: 'HONG123newpass' },
        });
        fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), {
            target: { value: 'HONG123newpass' },
        });
        fireEvent.click(screen.getByRole('button', { name: '저장' }));

        expect(
            screen.getByText('비밀번호에 아이디를 포함할 수 없습니다.'),
        ).toBeInTheDocument();
    });
});