import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UserItem } from '../../services/organization/usersService';
import { UserSelectDialog } from '../../shared/components/forms/UserSelectDialog';

function user(id: string, name: string, extra: Partial<UserItem> = {}): UserItem {
    return {
        id,
        tenantCode: 'T1',
        name,
        email: `${id}@example.com`,
        department: '품질관리팀',
        roleCode: 'USER',
        roleCodes: ['USER'],
        active: true,
        ...extra,
    };
}

const USERS = [user('u1', '홍길동'), user('u2', '김철수', { department: '생산팀' })];

function renderDialog(selectedUserId = '', onConfirm = vi.fn()) {
    render(
        <UserSelectDialog
            users={USERS}
            title="사원 선택"
            selectedUserId={selectedUserId}
            onClose={vi.fn()}
            onConfirm={onConfirm}
        />,
    );
    return { onConfirm };
}

describe('UserSelectDialog', () => {
    it('keeps only the last clicked user', async () => {
        const { onConfirm } = renderDialog();

        await userEvent.click(screen.getByText('홍길동'));
        await userEvent.click(screen.getByText('김철수'));
        await userEvent.click(screen.getByRole('button', { name: '확인' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith(USERS[1]);
    });

    it('disables confirm until a user is selected', () => {
        renderDialog();

        expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
    });

    it('starts with the given selected user', async () => {
        const { onConfirm } = renderDialog('u1');

        await userEvent.click(screen.getByRole('button', { name: '확인' }));

        expect(onConfirm).toHaveBeenCalledWith(USERS[0]);
    });
});