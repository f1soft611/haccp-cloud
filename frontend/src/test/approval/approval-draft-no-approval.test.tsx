import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApprovalDraftHeader } from '../../pages/documents/approvals/components/ApprovalDraftHeader';

describe('ApprovalDraftHeader 결재 미적용 문서', () => {
    it('임시저장 없이 저장 라벨로 넘기면 저장 버튼 하나만 있고 결재 신청 버튼은 없다', () => {
        render(
            <ApprovalDraftHeader
                onBack={() => undefined}
                onSubmitApproval={() => undefined}
                submitLabel="저장"
            />,
        );

        expect(screen.getAllByRole('button', { name: '저장' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: '결재 신청' })).toBeNull();
    });
});