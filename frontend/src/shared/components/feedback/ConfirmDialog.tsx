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
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
            borderRadius: 1,
            boxShadow: isDarkMode
              ? '0 20px 70px rgba(2, 6, 23, 0.6)'
              : '0 18px 48px rgba(15, 36, 64, 0.16)',
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
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
              bgcolor: isDarkMode
                ? 'rgba(251, 191, 36, 0.16)'
                : 'rgba(229, 122, 34, 0.12)',
              color: isDarkMode ? '#fbbf24' : '#c76b1f',
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
            sx={{
              fontWeight: 700,
              color: isDarkMode ? '#f8fafc' : '#115e59',
            }}
          >
            {title}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        <Typography
          sx={{
            color: isDarkMode
              ? 'rgba(248, 250, 252, 0.8)'
              : 'rgba(17, 94, 89, 0.8)',
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        data-testid="confirm-dialog-actions"
        sx={{
          px: 3,
          py: 2,
          borderTop: isDarkMode
            ? '1px solid rgba(251, 191, 36, 0.18)'
            : '1px solid rgba(66, 111, 106, 0.16)',
          bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
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
