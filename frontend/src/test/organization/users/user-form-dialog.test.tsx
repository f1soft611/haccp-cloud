import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers/AppProviders.tsx';
import { UserFormDialog } from '../../../pages/organization/users/components/UserFormDialog.tsx';

describe('UserFormDialog', () => {
  it('uses a department select and save-cancel action order', async () => {
    render(
      <AppProviders>
        <UserFormDialog
          open
          mode="create"
          departmentOptions={['생산관리부', '품질관리팀']}
          roleOptions={[
            { code: 'TENANT_ADMIN', name: '업체 관리자' },
            { code: 'TENANT_USER', name: '업체 사용자' },
          ]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </AppProviders>,
    );

    const departmentSelect = screen.getByRole('combobox', { name: '부서' });
    expect(departmentSelect).toBeInTheDocument();

    fireEvent.mouseDown(departmentSelect);
    expect(
      await screen.findByRole('option', { name: '생산관리부' }),
    ).toBeInTheDocument();

    const actions = screen.getByTestId('form-dialog-actions');
    const actionLabels = within(actions)
      .getAllByRole('button', { hidden: true })
      .map((button) => button.textContent?.trim() ?? '');

    expect(actionLabels.slice(0, 2)).toEqual(['저장', '취소']);
  });

    const roleOptions = [
        { code: 'TENANT_ADMIN', name: '업체 관리자' },
        { code: 'TENANT_USER', name: '업체 사용자' },
    ];

    const baseValue = {
        name: '홍길동',
        email: 'hong@alpha.com',
        department: '품질관리팀',
        roleCode: 'TENANT_USER',
        active: true,
        joinDate: '2024-03-02',
        retireDate: '',
    };

    it('submits join and retire dates', () => {
        const onSubmit = vi.fn();
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="edit"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={baseValue}
                    onClose={vi.fn()}
                    onSubmit={onSubmit}
                />
            </AppProviders>,
        );

        expect(screen.getByLabelText('입사일')).toHaveValue('2024-03-02');
        fireEvent.change(screen.getByLabelText('퇴사일'), {
            target: { value: '2026-10-20' },
        });
        fireEvent.click(screen.getByRole('button', { name: '저장' }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                joinDate: '2024-03-02',
                retireDate: '2026-10-20',
            }),
        );
    });

    it('blocks saving when retire date is before join date', () => {
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="edit"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={{ ...baseValue, retireDate: '2024-03-01' }}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                />
            </AppProviders>,
        );

        expect(
            screen.getByText('퇴사일은 입사일 이후여야 합니다.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('blocks saving when email format is invalid', () => {
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="edit"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={baseValue}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                />
            </AppProviders>,
        );

        expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
        expect(
            screen.queryByText('이메일 형식이 올바르지 않습니다.'),
        ).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('이메일'), {
            target: { value: 'hong@alpha' },
        });

        expect(
            screen.getByText('이메일 형식이 올바르지 않습니다.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('does not show email format error while email is empty', () => {
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="edit"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={{ ...baseValue, email: '' }}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                />
            </AppProviders>,
        );

        expect(
            screen.queryByText('이메일 형식이 올바르지 않습니다.'),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('shows duplicate email error and blocks saving', () => {
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="create"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={baseValue}
                    emailError="이미 등록된 이메일입니다."
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                />
            </AppProviders>,
        );

        expect(
            screen.getByText('이미 등록된 이메일입니다.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('calls onEmailChange when email is edited', () => {
        const onEmailChange = vi.fn();
        render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="create"
                    departmentOptions={['품질관리팀']}
                    roleOptions={roleOptions}
                    initialValue={baseValue}
                    emailError="이미 등록된 이메일입니다."
                    onEmailChange={onEmailChange}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                />
            </AppProviders>,
        );

        fireEvent.change(screen.getByLabelText('이메일'), {
            target: { value: 'hong2@alpha.com' },
        });

        expect(onEmailChange).toHaveBeenCalled();
    });
});
