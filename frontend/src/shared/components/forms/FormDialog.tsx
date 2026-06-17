import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  type DialogProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import type { ReactNode } from 'react';

export type FormDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  actions: ReactNode;
  children: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  contentSx?: SxProps<Theme>;
};

export function FormDialog({
  open,
  title,
  description,
  onClose,
  actions,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  contentSx,
}: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{
        paper: {
          sx: {
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(15, 36, 64, 0.28)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: '1px solid rgba(31, 79, 143, 0.08)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="span"
              variant="h5"
              sx={{ fontWeight: 700, color: '#183b67' }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="닫기"
            onClick={onClose}
            sx={{
              color: 'rgba(24, 59, 103, 0.72)',
              bgcolor: 'rgba(31, 79, 143, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(31, 79, 143, 0.12)',
              },
            }}
          >
            <Typography component="span" variant="subtitle2" fontWeight={800}>
              ×
            </Typography>
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={[
          {
            px: 3,
            pt: '24px !important',
            pb: 3,
            overflow: 'visible',
            '& .MuiFormControl-root': {
              width: '100%',
            },
            '& .MuiInputLabel-root': {
              px: 0.5,
              backgroundColor: 'rgba(255,255,255,0.92)',
            },
          },
          ...(Array.isArray(contentSx)
            ? contentSx
            : contentSx
              ? [contentSx]
              : []),
        ]}
      >
        {description ? (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: 'rgba(24, 59, 103, 0.72)',
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        ) : null}
        {children}
      </DialogContent>

      <DialogActions
        data-testid="form-dialog-actions"
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(31, 79, 143, 0.2)',
          bgcolor: 'rgba(245, 249, 255, 0.9)',
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(238,245,255,0.92) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.72)',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
}
