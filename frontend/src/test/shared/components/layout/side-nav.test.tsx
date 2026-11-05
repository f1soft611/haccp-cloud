import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {SideNav} from "../../../../shared/components/layout/SideNav.tsx";
import type { MenuGroup } from '../../../../shared/components/layout/workMenuConfig';

const menuGroups: MenuGroup[] = [
    {
        key: 'dashboard',
        label: '종합현황',
        roles: ['TENANT_ADMIN'],
        isSingleMenu: true,
        items: [{ label: '종합현황', path: '/dashboard', roles: ['TENANT_ADMIN'] }],
    },
    {
        key: 'haccp',
        label: 'HACCP관리',
        roles: ['TENANT_ADMIN'],
        items: [{ label: '작업일지', path: '/documents', roles: ['TENANT_ADMIN'] }],
    },
    {
        key: 'org',
        label: '조직관리',
        roles: ['TENANT_ADMIN'],
        items: [{ label: '사용자관리', path: '/org/users', roles: ['TENANT_ADMIN'] }],
    },
    {
        key: 'platform',
        label: '플랫폼관리',
        roles: ['PLATFORM_ADMIN'],
        items: [
            { label: '업체관리', path: '/platform/tenants', roles: ['PLATFORM_ADMIN'] },
        ],
    },
];

const renderSideNav = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/" element={<div>home-page</div>} />
                <Route
                    path="*"
                    element={
                        <SideNav
                            menuGroups={menuGroups}
                            role="TENANT_ADMIN"
                            mobileOpen={false}
                            onMobileClose={vi.fn()}
                        />
                    }
                />
            </Routes>
        </MemoryRouter>,
    );

describe('SideNav', () => {
    it('expands the group of the current route and marks the current item', () => {
        renderSideNav('/documents');

        expect(screen.getByRole('button', { name: 'HACCP관리' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('link', { name: '작업일지' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(
            screen.queryByRole('link', { name: '사용자관리' }),
        ).not.toBeInTheDocument();
    });

    it('opens another group on click while keeping the current group open', async () => {
        renderSideNav('/documents');

        fireEvent.click(screen.getByRole('button', { name: '조직관리' }));

        expect(
            await screen.findByRole('link', { name: '사용자관리' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '작업일지' })).toBeInTheDocument();
    });

    it('hides groups not allowed for the role', () => {
        renderSideNav('/documents');

        expect(
            screen.queryByRole('button', { name: '플랫폼관리' }),
        ).not.toBeInTheDocument();
    });

    it('navigates to home when the logo link is clicked', async () => {
        renderSideNav('/documents');

        const homeLink = screen.getByRole('link', {
            name: 'HACCP 관리시스템 문서 포털 홈으로 이동',
        });
        expect(homeLink).toHaveAttribute('href', '/');

        fireEvent.click(homeLink);

        expect(await screen.findByText('home-page')).toBeInTheDocument();
    });

    it('renders a single menu as a direct link without an expand button', () => {
        renderSideNav('/documents');

        expect(screen.getByRole('link', { name: '종합현황' })).toHaveAttribute(
            'href',
            '/dashboard',
        );
        expect(
            screen.queryByRole('button', { name: '종합현황' }),
        ).not.toBeInTheDocument();
        expect(screen.getAllByText('종합현황')).toHaveLength(1);
    });

    it('marks the single menu as current on its route', () => {
        renderSideNav('/dashboard');

        expect(screen.getByRole('link', { name: '종합현황' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(screen.getAllByText('종합현황')).toHaveLength(1);
    });

    it('keeps a group with one child as an expandable group', () => {
        renderSideNav('/documents');

        expect(screen.getByRole('button', { name: '조직관리' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
        expect(
            screen.queryByRole('link', { name: '사용자관리' }),
        ).not.toBeInTheDocument();
    });
});