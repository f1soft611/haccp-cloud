import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApprovalDraftHeader } from '../../pages/documents/approvals/components/ApprovalDraftHeader';
import { canDeleteDraft } from '../../pages/documents/approvals/utils/approvalDraftUtils';

describe('canDeleteDraft', () => {
    const base = {
        isOwner: true,
        approvalStatusType: 'pre_apply',
        draftNumber: '202610200001',
        approvalId: '77',
    };

    it('본인 + 임시저장 + 기안번호 + 결재ID가 있으면 true', () => {
        expect(canDeleteDraft(base)).toBe(true);
    });

    it('상태값 대소문자·공백은 무시한다', () => {
        expect(canDeleteDraft({ ...base, approvalStatusType: ' PRE_APPLY ' })).toBe(true);
    });

    it.each(['in_progress', 'approved', 'rejected', ''])(
        '%s 상태면 false',
        (status) => {
            expect(canDeleteDraft({ ...base, approvalStatusType: status })).toBe(false);
        },
    );

    it('작성자가 아니면 false', () => {
        expect(canDeleteDraft({ ...base, isOwner: false })).toBe(false);
    });

    it('기안번호가 없으면 false', () => {
        expect(canDeleteDraft({ ...base, draftNumber: ' ' })).toBe(false);
    });

    it('결재ID가 없으면 false', () => {
        expect(canDeleteDraft({ ...base, approvalId: undefined })).toBe(false);
    });
});

describe('ApprovalDraftHeader 삭제 버튼', () => {
    it('onDelete가 있으면 저장 버튼 바로 왼쪽에 삭제 버튼이 있다', () => {
        render(
            <ApprovalDraftHeader
                onBack={() => undefined}
                onDelete={() => undefined}
                onTempSave={() => undefined}
            />,
        );

        const buttons = screen.getAllByRole('button').map((button) => button.textContent);
        const saveIndex = buttons.indexOf('저장');
        expect(saveIndex).toBeGreaterThan(0);
        expect(buttons[saveIndex - 1]).toBe('삭제');
    });

    it('onDelete가 없으면 삭제 버튼이 없다', () => {
        render(<ApprovalDraftHeader onBack={() => undefined} onTempSave={() => undefined} />);

        expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
    });
});