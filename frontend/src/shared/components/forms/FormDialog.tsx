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
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
                        maxHeight: 'calc(100vh - 64px)',
                        display: 'flex',
                        flexDirection: 'column',
            boxShadow: isDarkMode
              ? '0 24px 80px rgba(2, 6, 23, 0.6)'
              : '0 24px 80px rgba(15, 36, 64, 0.28)',
            background: isDarkMode
              ? 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(15,23,42,0.98) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,253,250,0.98) 100%)',
            color: isDarkMode ? '#f8fafc' : '#111827',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: isDarkMode
            ? '1px solid rgba(251, 191, 36, 0.18)'
            : '1px solid rgba(20, 184, 166, 0.14)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="span"
              variant="h5"
              sx={{
                fontWeight: 700,
                color: isDarkMode ? '#f8fafc' : '#115e59',
              }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="닫기"
            onClick={onClose}
            sx={{
              color: isDarkMode
                ? 'rgba(248, 250, 252, 0.82)'
                : 'rgba(17, 94, 89, 0.72)',
              bgcolor: isDarkMode
                ? 'rgba(251, 191, 36, 0.12)'
                : 'rgba(20, 184, 166, 0.08)',
              '&:hover': {
                bgcolor: isDarkMode
                  ? 'rgba(251, 191, 36, 0.22)'
                  : 'rgba(20, 184, 166, 0.16)',
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
            overflow: 'auto',
            flex: 1,
            '& .MuiFormControl-root': {
              width: '100%',
            },
            '& .MuiInputLabel-root': {
              px: 0.5,
              backgroundColor: isDarkMode
                ? 'rgba(17,24,39,0.96)'
                : 'rgba(255,255,255,0.92)',
              color: isDarkMode ? 'rgba(248,250,252,0.78)' : undefined,
            },
            '& .MuiInputBase-input, & .MuiSelect-select': {
              color: isDarkMode ? '#f8fafc' : undefined,
            },
            '& .MuiOutlinedInput-root': {
              bgcolor: isDarkMode ? 'rgba(15,23,42,0.55)' : '#ffffff',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDarkMode
                ? 'rgba(251,191,36,0.26)'
                : 'rgba(20,184,166,0.2)',
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
              color: isDarkMode
                ? 'rgba(248, 250, 252, 0.72)'
                : 'rgba(17, 94, 89, 0.72)',
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
          borderTop: isDarkMode
            ? '1px solid rgba(251, 191, 36, 0.2)'
            : '1px solid rgba(20, 184, 166, 0.2)',
          bgcolor: isDarkMode
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(236, 253, 245, 0.92)',
          backgroundImage: isDarkMode
            ? 'linear-gradient(180deg, rgba(17,24,39,0.72) 0%, rgba(15,23,42,0.94) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(236,253,245,0.94) 100%)',
          boxShadow: isDarkMode
            ? 'inset 0 1px 0 rgba(251, 191, 36, 0.08)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.72)',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
}
