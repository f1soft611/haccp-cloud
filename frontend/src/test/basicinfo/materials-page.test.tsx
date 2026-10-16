import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { MaterialsPage } from '../../pages/basicinfo/materials/MaterialsPage.tsx';
import { useAuthStore } from '../../shared/store/authStore.ts';

const { listMaterialsPagedMock } = vi.hoisted(() => ({
    listMaterialsPagedMock: vi.fn(async () => ({ items: [], totalCount: 0 })),
}));

vi.mock('../../services/basicinfo/materialsService', () => ({
    listMaterialsPaged: listMaterialsPagedMock,
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
}));

vi.mock('../../services/basicinfo/commonCodeService', () => ({
    getCommonCodes: async () => ({
        groups: [],
        details: [
            { groupCode: 'ITEM_TYPE', code: 'PRODUCT', codeName: '제품', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
            { groupCode: 'ITEM_TYPE', code: 'RAW', codeName: '원재료', parentCodeName: '', useAt: true, sortOrder: 40, codeDesc: '' },
        ],
    }),
}));

describe('MaterialsPage 품목계정 검색', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('품목계정을 고르고 검색하면 itemTypes로 조회한다', async () => {
        render(
            <AppProviders>
                <MaterialsPage />
            </AppProviders>,
        );

        await vi.waitFor(() =>
            expect(listMaterialsPagedMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ itemTypes: undefined }),
            ),
        );

        fireEvent.mouseDown(screen.getByRole('combobox', { name: '품목계정' }));
        const listbox = await screen.findByRole('listbox');
        expect(within(listbox).getByRole('option', { name: '전체' })).toBeInTheDocument();
        fireEvent.click(await within(listbox).findByRole('option', { name: '원재료' }));

        fireEvent.click(screen.getByRole('button', { name: '검색' }));

        await vi.waitFor(() =>
            expect(listMaterialsPagedMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ itemTypes: ['RAW'], pageIndex: 1 }),
            ),
        );
    });
});