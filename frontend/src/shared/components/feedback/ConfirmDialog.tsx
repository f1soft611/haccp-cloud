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
  maxWidth = 'xs',
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 20px 70px rgba(15, 36, 64, 0.28)',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 42,
              height: 42,
              borderRadius: '50%',
              bgcolor: 'rgba(229, 122, 34, 0.12)',
              color: '#c76b1f',
              flexShrink: 0,
            }}
          >
            <Typography component="span" variant="subtitle2" fontWeight={800}>
              !
            </Typography>
          </Box>
          <Typography
            component="span"
            variant="h6"
            sx={{ fontWeight: 700, color: '#183b67' }}
          >
            {title}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        <Typography sx={{ color: 'rgba(24, 59, 103, 0.8)', lineHeight: 1.7 }}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        data-testid="confirm-dialog-actions"
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(31, 79, 143, 0.14)',
          bgcolor: 'rgba(244, 248, 251, 0.86)',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
        >
          {confirmText}
        </Button>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
