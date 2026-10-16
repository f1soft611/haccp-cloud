import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AttendeeSelectDialog } from '../../editor/components/AttendeeSelectDialog';
import type { UserItem } from '../../services/organization/usersService';

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

const USERS = [
    user('u1', '홍길동', { signatureImage: 'data:image/png;base64,AA' }),
    user('u2', '김철수', { department: '생산팀' }),
    user('u3', '퇴사자', { active: false }),
];

describe('AttendeeSelectDialog', () => {
    it('hides inactive users and filters by keyword', async () => {
        render(
            <AttendeeSelectDialog users={USERS} selected={[]} onClose={vi.fn()} onConfirm={vi.fn()} />,
        );

        expect(screen.queryByText('퇴사자')).not.toBeInTheDocument();

        await userEvent.type(screen.getByLabelText('이름/부서 검색'), '생산');

        expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
        expect(screen.getByText('김철수')).toBeInTheDocument();
    });

    it('returns checked users in click order with signature snapshot', async () => {
        const onConfirm = vi.fn();
        render(
            <AttendeeSelectDialog users={USERS} selected={[]} onClose={vi.fn()} onConfirm={onConfirm} />,
        );

        await userEvent.click(screen.getByText('김철수'));
        await userEvent.click(screen.getByText('홍길동'));
        await userEvent.click(screen.getByRole('button', { name: '확인 (2명)' }));

        expect(onConfirm).toHaveBeenCalledWith([
            { userId: 'u2', name: '김철수' },
            { userId: 'u1', name: '홍길동', signatureImage: 'data:image/png;base64,AA' },
        ]);
    });

    it('keeps existing snapshot for already selected attendees and allows unchecking', async () => {
        const onConfirm = vi.fn();
        render(
            <AttendeeSelectDialog
                users={USERS}
                selected={[
                    { userId: 'u1', name: '홍길동', signatureImage: 'data:old' },
                    { userId: 'u2', name: '김철수' },
                ]}
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />,
        );

        await userEvent.click(screen.getByText('김철수'));
        await userEvent.click(screen.getByRole('button', { name: '확인 (1명)' }));

        expect(onConfirm).toHaveBeenCalledWith([
            { userId: 'u1', name: '홍길동', signatureImage: 'data:old' },
        ]);
    });
});