import { Button, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appTheme } from '../app/theme';
import { ConfirmDialog } from '../shared/components/feedback/ConfirmDialog';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';
import { useFeedback } from '../shared/hooks/useFeedback';

function FeedbackTestTrigger() {
  const { showSuccess } = useFeedback();

  return (
    <Button onClick={() => showSuccess('저장이 완료되었습니다.')}>
      메시지 표시
    </Button>
  );
}

describe('feedback ui', () => {
  it('renders confirm dialog with separated action area', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <ConfirmDialog
          open
          title="삭제 확인"
          description="삭제 후에는 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          onConfirm={() => {}}
          onClose={() => {}}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('heading', { name: '삭제 확인' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('삭제 후에는 되돌릴 수 없습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-actions')).toHaveStyle({
      borderTopStyle: 'solid',
    });
  });

  it('shows snackbar feedback through provider hook', async () => {
    render(
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <FeedbackTestTrigger />
        </FeedbackProvider>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '메시지 표시' }));

    expect(
      await screen.findByText('저장이 완료되었습니다.'),
    ).toBeInTheDocument();
  });
});
