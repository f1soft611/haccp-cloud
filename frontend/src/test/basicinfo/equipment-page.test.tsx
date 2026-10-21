import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { EquipmentPage } from '../../pages/basicinfo/equipment/EquipmentPage.tsx';
import type {
    CreateEquipmentRequest,
    EquipmentItem,
    ListEquipmentPagedResult,
} from '../../services/basicinfo/equipmentService';
import { useAuthStore } from '../../shared/store/authStore.ts';

const { listEquipmentPagedMock, createEquipmentMock, deleteEquipmentMock, restoreEquipmentMock } = vi.hoisted(() => ({
    listEquipmentPagedMock: vi.fn(async (): Promise<ListEquipmentPagedResult> => ({ items: [], totalCount: 0 })),
    createEquipmentMock: vi.fn<(payload: CreateEquipmentRequest) => Promise<unknown>>(async () => ({})),
    deleteEquipmentMock: vi.fn<(payload: { tenantCode?: string; id: string }) => Promise<void>>(async () => undefined),
    restoreEquipmentMock: vi.fn<(payload: { tenantCode?: string; id: string }) => Promise<void>>(async () => undefined),
}));

vi.mock('../../services/basicinfo/equipmentService', () => ({
    listEquipmentPaged: listEquipmentPagedMock,
    createEquipment: createEquipmentMock,
    updateEquipment: vi.fn(),
    deleteEquipment: deleteEquipmentMock,
    restoreEquipment: restoreEquipmentMock,
}));

vi.mock('../../services/basicinfo/commonCodeService', () => ({
    getCommonCodes: async () => ({
        groups: [],
        details: [
            { groupCode: 'VC_KIND', code: 'INTERNAL', codeName: '자체', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
            { groupCode: 'VC_KIND', code: 'ACCREDITED', codeName: '공인기관', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
        ],
    }),
}));

function renderPage() {
    render(
        <AppProviders>
            <EquipmentPage />
        </AppProviders>,
    );
}

async function openCreateDialog() {
    renderPage();
    const createButton = screen.getByRole('button', { name: '설비 등록' });
    await waitFor(() => expect(createButton).toBeEnabled());
    fireEvent.click(createButton);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/설비코드/), { target: { value: 'EQ-01' } });
    fireEvent.change(within(dialog).getByLabelText(/설비명/), { target: { value: '온도계' } });
    return dialog;
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

describe('EquipmentPage 설비 등록 검교정', () => {
    it('검교정주기는 비워도 되고, 값이 있으면 1 이상의 정수여야 저장할 수 있다', async () => {
        const dialog = await openCreateDialog();
        const cycle = within(dialog).getByLabelText(/검교정주기/);
        const save = within(dialog).getByRole('button', { name: '저장' });
        expect(save).toBeEnabled();

        fireEvent.change(cycle, { target: { value: '0' } });
        expect(save).toBeDisabled();
        expect(within(dialog).getByText('1 이상의 정수를 입력하세요.')).toBeInTheDocument();

        fireEvent.change(cycle, { target: { value: '12' } });
        expect(save).toBeEnabled();
    });

    it('등록하면 검교정구분과 검교정주기(숫자)를 함께 저장한다', async () => {
        const dialog = await openCreateDialog();
        await selectOption(dialog, /검교정구분/, '공인기관');
        fireEvent.change(within(dialog).getByLabelText(/검교정주기/), { target: { value: '12' } });

        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        await waitFor(() => expect(createEquipmentMock).toHaveBeenCalled());
        expect(createEquipmentMock.mock.calls[0][0]).toEqual(
            expect.objectContaining({ equipCd: 'EQ-01', vcKind: 'ACCREDITED', vcCycle: 12 }),
        );
    });

    it('검교정주기를 비우고 등록하면 null로 저장한다', async () => {
        const dialog = await openCreateDialog();

        fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

        await waitFor(() => expect(createEquipmentMock).toHaveBeenCalled());
        expect(createEquipmentMock.mock.calls[0][0]).toEqual(
            expect.objectContaining({ vcKind: '', vcCycle: null }),
        );
    });
});

describe('EquipmentPage 설비 목록', () => {
    it('검교정구분 이름과 검교정주기(개월)를 보여 준다', async () => {
        listEquipmentPagedMock.mockResolvedValueOnce({
            items: [
                {
                    id: '1',
                    equipSysCd: '000001',
                    equipCd: 'EQ-01',
                    equipNm: '온도계',
                    equipKind: '',
                    purDate: '',
                    purCust: '',
                    makCust: '',
                    equipSpec: '',
                    location: '',
                    vcKind: 'ACCREDITED',
                    vcCycle: 12,
                    bigo: '',
                    active: true,
                },
            ],
            totalCount: 1,
        });
        renderPage();

        const row = (await screen.findByText('온도계')).closest('tr') as HTMLElement;
        expect(await within(row).findByText('공인기관')).toBeInTheDocument();
        expect(within(row).getByText('12개월')).toBeInTheDocument();
    });
});

function equipmentRow(overrides: Partial<EquipmentItem>): EquipmentItem {
    return {
        id: '1',
        equipSysCd: '000001',
        equipCd: 'EQ-01',
        equipNm: '온도계',
        equipKind: '',
        purDate: '',
        purCust: '',
        makCust: '',
        equipSpec: '',
        location: '',
        vcKind: '',
        vcCycle: null,
        bigo: '',
        active: true,
        ...overrides,
    };
}

describe('EquipmentPage 설비 삭제와 다시 사용', () => {
    it('사용 행에는 삭제 버튼, 미사용 행에는 다시 사용 버튼을 보여 준다', async () => {
        listEquipmentPagedMock.mockResolvedValueOnce({
            items: [
                equipmentRow({ id: '1', equipNm: '온도계', active: true }),
                equipmentRow({ id: '2', equipSysCd: '000002', equipCd: 'EQ-02', equipNm: '저울', active: false }),
            ],
            totalCount: 2,
        });
        renderPage();

        const activeRow = (await screen.findByText('온도계')).closest('tr') as HTMLElement;
        const inactiveRow = screen.getByText('저울').closest('tr') as HTMLElement;

        expect(within(activeRow).getByRole('button', { name: '설비 삭제' })).toBeInTheDocument();
        expect(within(activeRow).queryByRole('button', { name: '설비 다시 사용' })).not.toBeInTheDocument();
        expect(within(inactiveRow).getByRole('button', { name: '설비 다시 사용' })).toBeInTheDocument();
        expect(within(inactiveRow).queryByRole('button', { name: '설비 삭제' })).not.toBeInTheDocument();
    });

    it('삭제 확인 창은 미사용 처리를 안내하고, 확인하면 deleteEquipment를 호출한다', async () => {
        listEquipmentPagedMock.mockResolvedValueOnce({
            items: [equipmentRow({ id: '1', equipNm: '온도계', active: true })],
            totalCount: 1,
        });
        renderPage();

        const row = (await screen.findByText('온도계')).closest('tr') as HTMLElement;
        fireEvent.click(within(row).getByRole('button', { name: '설비 삭제' }));

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText("'온도계' 설비를 삭제하시겠습니까? 삭제하면 미사용으로 처리됩니다."),
        ).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

        await waitFor(() => expect(deleteEquipmentMock).toHaveBeenCalled());
        expect(deleteEquipmentMock.mock.calls[0][0]).toEqual({ tenantCode: 'TENANT-A', id: '1' });
    });

    it('다시 사용을 확인하면 restoreEquipment를 해당 id로 호출한다', async () => {
        listEquipmentPagedMock.mockResolvedValueOnce({
            items: [equipmentRow({ id: '2', equipNm: '저울', active: false })],
            totalCount: 1,
        });
        renderPage();

        const row = (await screen.findByText('저울')).closest('tr') as HTMLElement;
        fireEvent.click(within(row).getByRole('button', { name: '설비 다시 사용' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText("'저울' 설비를 다시 사용하시겠습니까?")).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole('button', { name: '사용' }));

        await waitFor(() => expect(restoreEquipmentMock).toHaveBeenCalled());
        expect(restoreEquipmentMock.mock.calls[0][0]).toEqual({ tenantCode: 'TENANT-A', id: '2' });
    });
});