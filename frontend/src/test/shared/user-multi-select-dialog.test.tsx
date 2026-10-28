import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UserItem } from '../../services/organization/usersService';
import { UserMultiSelectDialog } from '../../shared/components/forms/UserMultiSelectDialog';

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

function renderDialog(selectedUserIds: string[] = [], onConfirm = vi.fn()) {
    render(
        <UserMultiSelectDialog
            users={USERS}
            title="담당자 선택"
            selectedUserIds={selectedUserIds}
            onClose={vi.fn()}
            onConfirm={onConfirm}
        />,
    );
    return { onConfirm };
}

describe('UserMultiSelectDialog', () => {
    it('confirms checked user ids in click order', async () => {
        const { onConfirm } = renderDialog();

        await userEvent.click(screen.getByText('김철수'));
        await userEvent.click(screen.getByText('홍길동'));
        await userEvent.click(screen.getByRole('button', { name: '확인 (2명)' }));

        expect(onConfirm).toHaveBeenCalledWith(['u2', 'u1']);
    });

    it('starts with the given ids and unchecks on second click', async () => {
        const { onConfirm } = renderDialog(['u1', 'u2']);

        await userEvent.click(screen.getByText('홍길동'));
        await userEvent.click(screen.getByRole('button', { name: '확인 (1명)' }));

        expect(onConfirm).toHaveBeenCalledWith(['u2']);
    });
});
