import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { MaterialsPage } from '../../pages/basicinfo/materials/MaterialsPage.tsx';
import type {
    CreateMaterialRequest,
    ListMaterialsPagedResult,
} from '../../services/basicinfo/materialsService';
import { useAuthStore } from '../../shared/store/authStore.ts';

const { listMaterialsPagedMock, createMaterialMock } = vi.hoisted(() => ({
    listMaterialsPagedMock: vi.fn(async (): Promise<ListMaterialsPagedResult> => ({ items: [], totalCount: 0 })),
    createMaterialMock: vi.fn<(payload: CreateMaterialRequest) => Promise<unknown>>(async () => ({})),
}));

vi.mock('../../services/basicinfo/materialsService', () => ({
    listMaterialsPaged: listMaterialsPagedMock,
    createMaterial: createMaterialMock,
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
}));

vi.mock('../../services/basicinfo/commonCodeService', () => ({
    getCommonCodes: async () => ({
        groups: [],
        details: [
            { groupCode: 'ITEM_TYPE', code: 'PRODUCT', codeName: '제품', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
            { groupCode: 'ITEM_TYPE', code: 'RAW', codeName: '원재료', parentCodeName: '', useAt: true, sortOrder: 40, codeDesc: '' },
            { groupCode: 'MATERIAL_TYPE', code: 'FOOD', codeName: '식품', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
            { groupCode: 'STORE_METHOD', code: 'REFRIG', codeName: '냉장', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '' },
            { groupCode: 'EXPIRY_STATUS', code: 'NONE', codeName: '없음', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
            { groupCode: 'EXPIRY_STATUS', code: 'DAY', codeName: '일', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
            { groupCode: 'EXPIRY_STATUS', code: 'MONTH', codeName: '개월', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '' },
            { groupCode: 'EXPIRY_STATUS', code: 'YEAR', codeName: '년', parentCodeName: '', useAt: true, sortOrder: 40, codeDesc: '' },
        ],
    }),
}));

function renderPage() {
    render(
        <AppProviders>
            <MaterialsPage />
        </AppProviders>,
    );
}

async function openCreateDialog() {
    renderPage();
    const createButton = screen.getByRole('button', { name: '품목 등록' });
    await waitFor(() => expect(createButton).toBeEnabled());
    fireEvent.click(createButton);
    return screen.findByRole('dialog');
}

async function selectOption(dialog: HTMLElement, label: RegExp, option: string) {
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: label }));
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(await within(listbox).findByRole('option', { name: option }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

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

describe('MaterialsPage 품목계정 검색', () => {
    it('품목계정을 고르고 검색하면 itemTypes로 조회한다', async () => {
        renderPage();

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

describe('MaterialsPage 품목 등록 소비기한', () => {
    it('소비기한 기준이 없음이면 계산숫자를 입력할 수 없다', async () => {
        const dialog = await openCreateDialog();

        expect(within(dialog).getByLabelText(/소비기한 계산숫자/)).toBeDisabled();
    });

    it('소비기한 기준을 고르면 1 이상의 계산숫자가 있어야 저장할 수 있다', async () => {
        const dialog = await openCreateDialog();
        fireEvent.change(within(dialog).getByLabelText(/품목명/), { target: { value: '밀가루' } });

        await selectOption(dialog, /소비기한 기준/, '개월');

        const count = within(dialog).getByLabelText(/소비기한 계산숫자/);
        const save = within(dialog).getByRole('button', { name: '저장' });
        expect(count).toBeEnabled();
        expect(save).toBeDisabled();

        fireEvent.change(count, { target: { value: '0' } });
        expect(save).toBeDisabled();

        fireEvent.change(count, { target: { value: '12' } });
        expect(save).toBeEnabled();

        await selectOption(dialog, /소비기한 기준/, '없음');
        expect(count).toBeDisabled();
        expect(count).toHaveValue(null);
        expect(save).toBeEnabled();
    });

    it('등록하면 새 항목 5개를 함께 저장한다', async () => {
        const dialog = await openCreateDialog();
        fireEvent.change(within(dialog).getByLabelText(/품목명/), { target: { value: '밀가루' } });
        await selectOption(dialog, /품목유형구분/, '식품');
        await selectOption(dialog, /보관방법/, '냉장');
        await selectOption(dialog, /소비기한 기준/, '개월');
        fireEvent.change(within(dialog).getByLabelText(/소비기한 계산숫자/), { target: { value: '12' } });
        fireEvent.change(within(dialog).getByLabelText(/품목보고번호/), { target: { value: ' 2026-0001 ' } });

        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        await waitFor(() => expect(createMaterialMock).toHaveBeenCalled());
        expect(createMaterialMock.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                materialName: '밀가루',
                materialKind: 'FOOD',
                storeMethod: 'REFRIG',
                expiryedStatus: 'MONTH',
                expiryedCount: 12,
                kfdaReportNo: '2026-0001',
            }),
        );
    });
});