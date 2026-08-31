import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, afterEach } from 'vitest';
import { ProtectedRoute } from '../app/router/ProtectedRoute';
import { useAuthStore } from '../shared/store/authStore';

function renderAt(path: string) {
    const queryClient = new QueryClient();

    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <div>사용자 관리 화면</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/account/password"
                        element={
                            <ProtectedRoute>
                                <div>비밀번호 변경 화면</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ProtectedRoute', () => {
    afterEach(() => {
        useAuthStore.setState({
            isAuthenticated: false,
            role: 'USER',
            mustChangePassword: false,
            onboardingRequired: false,
            onboardingStatus: 'COMPLETED',
        });
    });

    it('redirects to the password change screen when mustChangePassword is true', () => {
        useAuthStore.setState({
            isAuthenticated: true,
            role: 'USER',
            mustChangePassword: true,
            onboardingRequired: false,
            onboardingStatus: 'COMPLETED',
        });

        renderAt('/users');

        expect(screen.getByText('비밀번호 변경 화면')).toBeInTheDocument();
        expect(screen.queryByText('사용자 관리 화면')).not.toBeInTheDocument();
    });

    it('does not redirect away from the password change screen itself', () => {
        useAuthStore.setState({
            isAuthenticated: true,
            role: 'USER',
            mustChangePassword: true,
            onboardingRequired: false,
            onboardingStatus: 'COMPLETED',
        });

        renderAt('/account/password');

        expect(screen.getByText('비밀번호 변경 화면')).toBeInTheDocument();
    });

    it('renders the protected content when mustChangePassword is false', () => {
        useAuthStore.setState({
            isAuthenticated: true,
            role: 'USER',
            mustChangePassword: false,
            onboardingRequired: false,
            onboardingStatus: 'COMPLETED',
        });

        renderAt('/users');

        expect(screen.getByText('사용자 관리 화면')).toBeInTheDocument();
    });
});