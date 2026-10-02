import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../app/theme';
import { PlatformTenantGrid } from '../../pages/platform-admin/tenants/components/PlatformTenantGrid';

function renderGrid(tenantNo?: string) {
    render(
        <ThemeProvider theme={appTheme}>
            <PlatformTenantGrid
                rows={[
                    {
                        tenantCode: '1234567890',
                        tenantNo,
                        companyName: '테스트푸드',
                        adminName: '홍길동',
                        adminEmail: 'admin@test.com',
                        status: 'ACTIVE',
                        onboardingStatus: 'ACTIVE',
                        createdAt: '2026-10-02T00:00:00Z',
                    },
                ]}
                loading={false}
                pageIndex={1}
                pageSize={10}
                totalCount={1}
                onPageChange={vi.fn()}
                onPageSizeChange={vi.fn()}
            />
        </ThemeProvider>,
    );
}

describe('PlatformTenantGrid', () => {
    it('업체번호 컬럼과 값을 표시한다', () => {
        renderGrid('482913');

        expect(
            screen.getByRole('columnheader', { name: '업체번호' }),
        ).toBeInTheDocument();
        expect(screen.getByText('482913')).toBeInTheDocument();
    });

    it('업체번호가 없으면 - 를 표시한다', () => {
        renderGrid(undefined);

        const row = screen.getByText('테스트푸드').closest('tr');
        expect(row?.querySelectorAll('td')[1]).toHaveTextContent('-');
    });
});