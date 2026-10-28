import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserFormDialog } from '../../../pages/organization/users/components/UserFormDialog.tsx';

const baseProps = {
    open: true,
    departmentOptions: ['품질관리팀'],
    roleOptions: [{ code: 'TENANT_USER', name: '업체 사용자' }],
    onClose: () => {},
    onSubmit: () => {},
};

describe('UserFormDialog 비밀번호 초기화 버튼', () => {
    it('수정 모드에서 버튼을 누르면 onResetPassword 호출', async () => {
        const user = userEvent.setup();
        const onResetPassword = vi.fn();

        render(
            <UserFormDialog
                {...baseProps}
                mode="edit"
                onResetPassword={onResetPassword}
            />,
        );

        await user.click(screen.getByRole('button', { name: '비밀번호 초기화' }));
        expect(onResetPassword).toHaveBeenCalledTimes(1);
    });

    it('등록 모드에서는 버튼이 없다', () => {
        render(
            <UserFormDialog
                {...baseProps}
                mode="create"
                onResetPassword={() => {}}
            />,
        );

        expect(
            screen.queryByRole('button', { name: '비밀번호 초기화' }),
        ).not.toBeInTheDocument();
    });
});