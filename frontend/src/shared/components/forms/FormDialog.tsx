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
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

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
  const scope = useSharedScope();

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    <Dialog
      {...scope}
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{ paper: { className: styles.formDialogPaper } }}
    >
      <DialogTitle className={styles.formDialogTitle}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box className={styles.formDialogTitleBox}>
            <Typography
              component="span"
              variant="h5"
              className={styles.formDialogTitleText}
            >
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="닫기"
            onClick={onClose}
            className={styles.formDialogClose}
          >
            <Typography component="span" variant="subtitle2" className={styles.formDialogCloseMark}>
              ×
            </Typography>
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        className={styles.formDialogContent}
        sx={[
          { flex: 1 },
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
            className={styles.formDialogDescription}
          >
            {description}
          </Typography>
        ) : null}
        {children}
      </DialogContent>

      <DialogActions
        data-testid="form-dialog-actions"
        className={styles.formDialogActions}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
}
