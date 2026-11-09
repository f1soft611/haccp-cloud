import { Button, TextField, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appTheme, darkTheme } from '../../../../app/theme';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';

function renderDialog(theme = appTheme) {
  render(
    <ThemeProvider theme={theme}>
      <FormDialog
        open
        title="메뉴 수정"
        description="등록과 수정에서 함께 쓰는 공통 모달"
        onClose={vi.fn()}
        actions={<Button variant="contained">저장</Button>}
      >
        <TextField label="메뉴명" fullWidth />
      </FormDialog>
    </ThemeProvider>,
  );
}

describe('FormDialog', () => {
  it('renders title, description, children, and footer actions', () => {
    renderDialog();

    expect(
      screen.getByRole('heading', { name: /메뉴 수정/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('등록과 수정에서 함께 쓰는 공통 모달'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('메뉴명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('adds a separated footer action area', () => {
    renderDialog();

    expect(screen.getByTestId('form-dialog-actions')).toBeInTheDocument();
  });

  it('applies the current theme mode to the dialog scope', () => {
    renderDialog(darkTheme);

    const title = screen.getByRole('heading', { name: /메뉴 수정/ });

    expect(title.closest('[data-mode]')).toHaveAttribute('data-mode', 'dark');
  });
});
