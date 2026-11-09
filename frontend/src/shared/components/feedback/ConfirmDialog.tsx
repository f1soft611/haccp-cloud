import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  type DialogProps,
} from '@mui/material';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
    onCancel?: () => void;
  maxWidth?: DialogProps['maxWidth'];
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onClose,
                                  onCancel,
  maxWidth = 'xs',
}: ConfirmDialogProps) {
  const scope = useSharedScope();

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    <Dialog
      {...scope}
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ paper: { className: styles.confirmPaper } }}
    >
      <DialogTitle className={styles.confirmTitle}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box className={styles.confirmIcon}>
            <Typography component="span" variant="subtitle2" className={styles.confirmIconMark}>
              !
            </Typography>
          </Box>
          <Typography
            component="span"
            variant="h6"
            className={styles.confirmTitleText}
          >
            {title}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent className={styles.confirmContent}>
        <Typography className={styles.confirmDescription}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        data-testid="confirm-dialog-actions"
        className={styles.confirmActions}
      >
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
        >
          {confirmText}
        </Button>
          <Button onClick={onCancel ?? onClose} disabled={loading} color="inherit">
              {cancelText}
          </Button>
      </DialogActions>
    </Dialog>
  );
}
