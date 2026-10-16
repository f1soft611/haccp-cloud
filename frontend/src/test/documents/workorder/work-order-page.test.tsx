import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers/AppProviders.tsx';
import { WorkOrderPage } from '../../../pages/documents/work-order/WorkOrderPage.tsx';
import { useAuthStore } from '../../../shared/store/authStore.ts';

// 기존 -> 화면 state 샘플 데이터로 동작 검증
// 변경 -> 서비스 모킹 후 API 호출 인자와 화면 반영 검증
const {
    listWorkOrdersPagedMock,
    createWorkOrderMock,
    updateWorkOrderMock,
    deleteWorkOrderMock,
    listMaterialsPagedMock,
} = vi.hoisted(() => ({
    listWorkOrdersPagedMock: vi.fn(async () => ({
        items: [
            {
                id: 'wo-1',
                workdtNo: '202610150001',
                materialId: 'm-1',
                itemName: '배추김치',
                productionDate: '2026-10-15',
                expiryDate: '2027-10-15',
                quantity: 500,
                unit: 'kg',
                spec: '10kg/박스',
                remark: '',
            },
        ],
        totalCount: 1,
    })),
    // mock.calls[0][0] 접근 시 타입 오류가 없도록 인자 타입을 명시
    createWorkOrderMock: vi.fn<(payload: unknown) => Promise<object>>(async () => ({})),
    updateWorkOrderMock: vi.fn<(payload: unknown) => Promise<object>>(async () => ({})),
    deleteWorkOrderMock: vi.fn<(payload: unknown) => Promise<void>>(async () => undefined),
    listMaterialsPagedMock: vi.fn(async () => ({
        items: [
            {
                id: 'm-2',
                materialCode: '000002',
                materialName: '깍두기',
                itemType: 'PRODUCT',
                materialSpec: '5kg/박스',
                materialWeight: null,
                unit: 'kg',
                etc: '',
            },
        ],
        totalCount: 1,
    })),
}));

vi.mock('../../../services/documents/workOrderService', () => ({
    listWorkOrdersPaged: listWorkOrdersPagedMock,
    createWorkOrder: createWorkOrderMock,
    updateWorkOrder: updateWorkOrderMock,
    deleteWorkOrder: deleteWorkOrderMock,
}));

vi.mock('../../../services/basicinfo/materialsService', () => ({
    listMaterialsPaged: listMaterialsPagedMock,
}));

function renderPage() {
    render(
        <AppProviders>
            <WorkOrderPage />
        </AppProviders>,
    );
}

describe('WorkOrderPage', () => {
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

    it('조회 결과를 작업지시번호와 함께 보여준다', async () => {
        renderPage();
        expect(await screen.findByText('202610150001')).toBeInTheDocument();
        const table = screen.getByRole('table', { name: '작업지시 목록' });
        expect(within(table).getByText('배추김치')).toBeInTheDocument();
        expect(screen.getByText('총 1건')).toBeInTheDocument();
    });

    it('신규 다이얼로그를 비운 채 저장하면 필드 오류를 보여준다', async () => {
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: '신규' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
        expect(within(dialog).getByText('품목을 선택하세요.')).toBeInTheDocument();
        expect(within(dialog).getByText('생산량은 0보다 커야 합니다.')).toBeInTheDocument();
        expect(createWorkOrderMock).not.toHaveBeenCalled();
    });

    it('품목 선택 시 단위·규격을 채우고, 생산계획일 + 1년을 소비기한으로 설정해 등록한다', async () => {
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: '신규' }));
        const dialog = screen.getByRole('dialog');

        fireEvent.change(within(dialog).getByRole('combobox', { name: /품목/ }), {
            target: { value: '깍' },
        });
        fireEvent.click(await screen.findByRole('option', { name: '깍두기' }));
        expect(within(dialog).getByLabelText('단위')).toHaveValue('kg');
        expect(within(dialog).getByLabelText('규격')).toHaveValue('5kg/박스');

        fireEvent.change(within(dialog).getByLabelText(/^생산계획일/), { target: { value: '2026-10-15' } });
        expect(within(dialog).getByLabelText(/^소비기한/)).toHaveValue('2027-10-15');

        fireEvent.change(within(dialog).getByLabelText(/^생산량/), { target: { value: '100' } });
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        await vi.waitFor(() => expect(createWorkOrderMock).toHaveBeenCalled());
        expect(createWorkOrderMock.mock.calls[0][0]).toMatchObject({
            tenantCode: 'TENANT-A',
            materialId: 'm-2',
            productionDate: '2026-10-15',
            expiryDate: '2027-10-15',
            quantity: 100,
        });
        expect(await screen.findByText('등록되었습니다.')).toBeInTheDocument();
    });

    it('수정 다이얼로그는 작업지시번호와 기존 값을 보여주고 수정 API를 호출한다', async () => {
        renderPage();
        fireEvent.click((await screen.findAllByRole('button', { name: '작업지시 수정' }))[0]);
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByLabelText('작업지시번호')).toHaveValue('202610150001');
        expect(within(dialog).getByRole('combobox', { name: /품목/ })).toHaveValue('배추김치');

        fireEvent.change(within(dialog).getByLabelText(/^생산량/), { target: { value: '300' } });
        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        await vi.waitFor(() => expect(updateWorkOrderMock).toHaveBeenCalled());
        expect(updateWorkOrderMock.mock.calls[0][0]).toMatchObject({ id: 'wo-1', materialId: 'm-1', quantity: 300 });
        expect(await screen.findByText('수정되었습니다.')).toBeInTheDocument();
    });

    it('삭제 아이콘으로 확인 후 삭제 API를 호출한다', async () => {
        renderPage();
        fireEvent.click((await screen.findAllByRole('button', { name: '작업지시 삭제' }))[0]);
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
        await vi.waitFor(() => expect(deleteWorkOrderMock).toHaveBeenCalled());
        expect(deleteWorkOrderMock.mock.calls[0][0]).toMatchObject({ id: 'wo-1', tenantCode: 'TENANT-A' });
        expect(await screen.findByText('삭제되었습니다.')).toBeInTheDocument();
    });

    it('품명으로 조회하면 검색어를 서버에 전달한다', async () => {
        renderPage();
        await screen.findByText('202610150001');
        fireEvent.change(screen.getByRole('textbox', { name: '품명' }), { target: { value: '깍두기' } });
        fireEvent.click(screen.getByRole('button', { name: '조회' }));
        await vi.waitFor(() =>
            expect(listWorkOrdersPagedMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ keyword: '깍두기', pageIndex: 1 }),
            ),
        );
    });
});