import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../../app/providers/AppProviders';
import { HaccpBaseCreateDialog } from '../../../../pages/documents/haccp-base/components/HaccpBaseCreateDialog';
import type { HaccpBaseCreateForm } from '../../../../pages/documents/haccp-base/types';

// 다이얼로그 단독 렌더용 빈 폼
const EMPTY_FORM: HaccpBaseCreateForm = {
    divisionCode: '',
    divisionName: '',
    categoryId: '',
    cycle: '',
    reviewerId: '',
    approverId: '',
    assigneeIds: [],
    expirationApply: 'N',
    expirationNoticeStatus: 'NONE',
    expirationNoticeCount: '',
    cycleAnchorType: 'DATE',
    workStartDate: '',
    workStartMonth: '',
    cycleAnchorWeek: '',
    cycleAnchorWeekday: '',
    approvalApply: 'Y',
    useAt: 'Y',
};

const CYCLE_OPTIONS = [
    { code: 'WEEK', name: '주간' },
    { code: 'HALF', name: '반기' },
];

// 폼 값과 onChange 스파이를 받아 다이얼로그를 그린다
function renderDialog(value: Partial<HaccpBaseCreateForm>, onChange = vi.fn()) {
    render(
        <AppProviders>
            <HaccpBaseCreateDialog
                open
                mode="create"
                categoryOptions={[{ id: '10', code: '001', name: 'HACCP선행일지' }]}
                userOptions={[]}
                value={{ ...EMPTY_FORM, ...value }}
                onClose={vi.fn()}
                onChange={onChange}
                onSubmit={vi.fn()}
                cycleOptions={CYCLE_OPTIONS}
            />
        </AppProviders>,
    );
    return onChange;
}

describe('HaccpBaseCreateDialog 배치', () => {
    it('업무코드 칸 없이 분류가 업무명 앞에 온다', () => {
        renderDialog({});
        const dialog = screen.getByRole('dialog');

        expect(within(dialog).queryByRole('textbox', { name: /업무코드/ })).not.toBeInTheDocument();
        const category = within(dialog).getByRole('combobox', { name: /분류/ });
        const name = within(dialog).getByRole('textbox', { name: /업무명/ });
        // 분류가 업무명보다 DOM 상 앞
        expect(category.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('시작일 기준이 토글이 아니라 셀렉트다', () => {
        renderDialog({ cycle: 'HALF' });

        expect(screen.queryByRole('group', { name: '시작일 기준' })).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '시작일 기준' })).toBeInTheDocument();
    });

    it('월 이상 주기면 시작일 기준에서 주차 기준을 고를 수 있다', () => {
        const onChange = renderDialog({ cycle: 'HALF' });

        fireEvent.mouseDown(screen.getByRole('combobox', { name: '시작일 기준' }));
        fireEvent.click(screen.getByRole('option', { name: '주차 기준' }));

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cycleAnchorType: 'WEEKDAY' }));
    });

    it('월 미만 주기면 시작일 기준이 일자 기준으로 비활성화된다', () => {
        renderDialog({ cycle: 'WEEK' });

        const anchor = screen.getByRole('combobox', { name: '시작일 기준' });
        expect(anchor).toHaveAttribute('aria-disabled', 'true');
        expect(anchor).toHaveTextContent('일자 기준');
    });

    it('주차 기준 값이면 셀렉트에 주차 기준과 연월/주차/요일 칸이 보인다', () => {
        renderDialog({ cycle: 'HALF', cycleAnchorType: 'WEEKDAY' });

        expect(screen.getByRole('combobox', { name: '시작일 기준' })).toHaveTextContent('주차 기준');
        expect(screen.getByLabelText('시작 연월')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '주차' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '요일' })).toBeInTheDocument();
    });
});