import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { UserFormDialog } from '../pages/organization/users/components/UserFormDialog';

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


    it('shows a password reset button next to the active toggle only in edit mode', () => {
        const onResetPassword = vi.fn();

        const { rerender } = render(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="create"
                    departmentOptions={['생산관리부']}
                    roleOptions={[{ code: 'TENANT_USER', name: '업체 사용자' }]}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                    onResetPassword={onResetPassword}
                />
            </AppProviders>,
        );

        expect(
            screen.queryByRole('button', { name: '비밀번호 초기화' }),
        ).not.toBeInTheDocument();

        rerender(
            <AppProviders>
                <UserFormDialog
                    open
                    mode="edit"
                    departmentOptions={['생산관리부']}
                    roleOptions={[{ code: 'TENANT_USER', name: '업체 사용자' }]}
                    initialValue={{
                        name: '홍길동',
                        email: 'hong@test.com',
                        department: '생산관리부',
                        roleCode: 'TENANT_USER',
                        active: true,
                    }}
                    onClose={vi.fn()}
                    onSubmit={vi.fn()}
                    onResetPassword={onResetPassword}
                />
            </AppProviders>,
        );

        const resetButton = screen.getByRole('button', { name: '비밀번호 초기화' });
        fireEvent.click(resetButton);
        expect(onResetPassword).toHaveBeenCalledTimes(1);
    });

});
