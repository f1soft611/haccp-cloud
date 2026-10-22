import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { ApprovalDraftExpirationFields } from '../../pages/documents/approvals/components/ApprovalDraftExpirationFields';
import {
    EMPTY_APPROVAL_SUB,
    getApprovalSubFieldConfig,
} from '../../pages/documents/approvals/utils/approvalSubFields';
import type { EquipmentItem } from '../../services/basicinfo/equipmentService';
import type { ApprovalSubValues } from '../../services/documents/haccpBaseWorkService';

const { listEquipmentPagedMock } = vi.hoisted(() => ({
    listEquipmentPagedMock: vi.fn(),
}));

vi.mock('../../services/basicinfo/equipmentService', () => ({
    listEquipmentPaged: listEquipmentPagedMock,
}));

vi.mock('../../services/basicinfo/commonCodeService', () => ({
    getCommonCodes: async () => ({ groups: [], details: [] }),
}));

function equipment(id: string, equipNm: string): EquipmentItem {
    return {
        id,
        equipSysCd: id,
        equipCd: `EQ-${id}`,
        equipNm,
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
    };
}

function renderCalibFields(onChange: (next: ApprovalSubValues) => void) {
    render(
        <AppProviders>
            <ApprovalDraftExpirationFields
                tenantCode="TENANT-A"
                config={getApprovalSubFieldConfig('HCP-CALIB')!}
                value={EMPTY_APPROVAL_SUB}
                onChange={onChange}
                users={[]}
            />
        </AppProviders>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    listEquipmentPagedMock.mockResolvedValue({
        items: [equipment('1', '온도계'), equipment('2', '저울'), equipment('3', '표준온도계')],
        totalCount: 3,
    });
});

describe('ApprovalDraftExpirationFields 설비 선택', () => {
    it('타이핑한 글자가 이름에 포함된 설비만 목록에 보인다', async () => {
        renderCalibFields(() => undefined);

        fireEvent.change(screen.getByRole('combobox', { name: /설비/ }), {
            target: { value: '온도' },
        });

        expect(await screen.findByRole('option', { name: '온도계' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '표준온도계' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '저울' })).toBeNull();
    });

    it('목록에서 입력한 글자와 매칭된 부분을 따로 감싸 하이라이트한다', async () => {
        renderCalibFields(() => undefined);

        fireEvent.change(screen.getByRole('combobox', { name: /설비/ }), {
            target: { value: '온도' },
        });

        const option = await screen.findByRole('option', { name: '표준온도계' });
        expect(within(option).getByText('온도')).toHaveStyle({ fontWeight: '700' });
    });

    it('목록에서 설비를 고르면 equipmentId 에 해당 id 를 담아 onChange 를 호출한다', async () => {
        const onChange = vi.fn();
        renderCalibFields(onChange);

        fireEvent.change(screen.getByRole('combobox', { name: /설비/ }), {
            target: { value: '저울' },
        });
        fireEvent.click(await screen.findByRole('option', { name: '저울' }));

        await waitFor(() =>
            expect(onChange).toHaveBeenCalledWith({ ...EMPTY_APPROVAL_SUB, equipmentId: '2' }),
        );
    });
});