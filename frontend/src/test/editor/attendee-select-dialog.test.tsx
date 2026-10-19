import { render, screen, within } from '@testing-library/react';
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

        await userEvent.type(screen.getByLabelText('이름 검색'), '김철');

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

    const DEPT_USERS = [
        user('a1', '홍길동'),
        user('a2', '이영희'),
        user('b1', '김철수', { department: '생산팀' }),
        user('c1', '박미정', { department: '' }),
    ];

    function renderDeptDialog(onConfirm = vi.fn()) {
        render(
            <AttendeeSelectDialog users={DEPT_USERS} selected={[]} onClose={vi.fn()} onConfirm={onConfirm} />,
        );
        return { deptList: screen.getByRole('list', { name: '부서 목록' }), onConfirm };
    }

    describe('AttendeeSelectDialog 부서별 보기', () => {
        it('filters users by clicked department', async () => {
            const { deptList } = renderDeptDialog();

            await userEvent.click(within(deptList).getByText('생산팀'));

            expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
            expect(screen.getByText('김철수')).toBeInTheDocument();
        });

        it('selects and unselects every user of a department without changing the filter', async () => {
            renderDeptDialog();
            const deptCheckbox = screen.getByRole('checkbox', { name: '품질관리팀 부서 선택' });

            await userEvent.click(deptCheckbox);

            expect(screen.getByRole('button', { name: '확인 (2명)' })).toBeInTheDocument();
            expect(screen.getByText('김철수')).toBeInTheDocument();

            await userEvent.click(deptCheckbox);

            expect(screen.getByRole('button', { name: '확인 (0명)' })).toBeInTheDocument();
        });

        it('marks department checkbox indeterminate when only some users are selected', async () => {
            renderDeptDialog();

            await userEvent.click(screen.getByText('홍길동'));

            expect(screen.getByRole('checkbox', { name: '품질관리팀 부서 선택' })).toHaveAttribute(
                'data-indeterminate',
                'true',
            );
        });

        it('select-all only affects users visible after search', async () => {
            const { onConfirm } = renderDeptDialog();

            await userEvent.type(screen.getByLabelText('이름 검색'), '홍');
            await userEvent.click(screen.getByLabelText(/^전체선택/));
            await userEvent.click(screen.getByRole('button', { name: '확인 (1명)' }));

            expect(onConfirm).toHaveBeenCalledWith([{ userId: 'a1', name: '홍길동' }]);
        });

        it('groups users without department under 미지정', async () => {
            const { deptList } = renderDeptDialog();

            await userEvent.click(within(deptList).getByText('미지정'));

            expect(screen.getByText('박미정')).toBeInTheDocument();
            expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
        });
    });
});