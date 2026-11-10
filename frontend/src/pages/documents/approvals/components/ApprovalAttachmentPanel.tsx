import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, FileUp, Trash } from 'lucide-react';
import {
  deleteHaccpAttachment,
  listHaccpAttachments,
  presignHaccpAttachmentDownload,
  presignHaccpAttachmentPreview,
  type HaccpAttachmentItem,
} from '../../../../services/documents/haccpAttachmentService';
import { uploadApprovalAttachments } from '../utils/approvalAttachmentUpload';
import { ConfirmDialog } from '../../../../shared/components/feedback/ConfirmDialog';

type ApprovalAttachmentPanelProps = {
  tenantCode: string;
  approvalId: string;
  isReadOnly?: boolean;
  onChanged?: () => void | Promise<void>;
  pendingFiles?: File[];
  onChangePendingFiles?: (files: File[]) => void;
};

export function ApprovalAttachmentPanel(props: ApprovalAttachmentPanelProps) {
  const {
    tenantCode,
    approvalId,
    isReadOnly = false,
    onChanged,
    pendingFiles = [],
    onChangePendingFiles,
  } = props;
  const normalizedApprovalId = String(approvalId || '').trim();
  const canUseAttachmentApi = normalizedApprovalId.length > 0;
  const isPendingMode = !canUseAttachmentApi && Boolean(onChangePendingFiles);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<HaccpAttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HaccpAttachmentItem | null>(
    null,
  );

  const loadAttachments = async (silent = false) => {
    if (!canUseAttachmentApi) {
      setAttachments([]);
      return;
    }

    try {
      const data = await listHaccpAttachments({
        tenantCode,
        approvalId: normalizedApprovalId,
      });
      setAttachments(data.items ?? []);
    } catch (error) {
      if (!silent) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '첨부파일 목록을 불러오지 못했습니다.',
        );
      }
    }
  };

  useEffect(() => {
    void loadAttachments();
  }, [tenantCode, normalizedApprovalId, canUseAttachmentApi]);

  useEffect(() => {
    if (!canUseAttachmentApi) {
      return;
    }

    const handleFocusReload = () => {
      if (document.visibilityState === 'visible') {
        void loadAttachments(true);
      }
    };

    const handleVisibilityReload = () => {
      if (document.visibilityState === 'visible') {
        void loadAttachments(true);
      }
    };

    window.addEventListener('focus', handleFocusReload);
    document.addEventListener('visibilitychange', handleVisibilityReload);

    return () => {
      window.removeEventListener('focus', handleFocusReload);
      document.removeEventListener('visibilitychange', handleVisibilityReload);
    };
  }, [tenantCode, normalizedApprovalId, canUseAttachmentApi]);

  const handleSelectFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (!files.length) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (isPendingMode) {
      onChangePendingFiles?.([...pendingFiles, ...files]);
      return;
    }

    if (!canUseAttachmentApi) {
      setErrorMessage('결재 문서가 생성된 후 첨부파일을 업로드할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadApprovalAttachments({
        tenantCode,
        approvalId: normalizedApprovalId,
        files,
      });
      if (result.succeeded) {
        if (onChanged) {
          await onChanged();
        }
        setSuccessMessage('첨부파일 업로드가 완료되었습니다.');
      }
      if (result.failed) {
        setErrorMessage(result.errorMessage ?? '첨부파일 업로드에 실패했습니다.');
      }
      await loadAttachments();
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePendingFile = (targetIndex: number) => {
    onChangePendingFiles?.(
      pendingFiles.filter((_, index) => index !== targetIndex),
    );
  };

  const handlePreview = async (attachment: HaccpAttachmentItem) => {
    if (!attachment.attachmentId) {
      return;
    }

    try {
      const { previewUrl } = await presignHaccpAttachmentPreview({
        tenantCode,
        approvalId: normalizedApprovalId,
        attachmentId: attachment.attachmentId,
      });
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '미리보기 URL을 생성하지 못했습니다.',
      );
    }
  };

  const handleDownload = async (attachment: HaccpAttachmentItem) => {
    if (!attachment.attachmentId) {
      return;
    }

    try {
      const { downloadUrl } = await presignHaccpAttachmentDownload({
        tenantCode,
        approvalId: normalizedApprovalId,
        attachmentId: attachment.attachmentId,
      });
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '다운로드 URL을 생성하지 못했습니다.',
      );
    }
  };

  const handleDelete = async (attachment: HaccpAttachmentItem) => {
    if (!attachment.attachmentId) {
      return;
    }

    setDeleteTarget(attachment);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.attachmentId) {
      return;
    }

    try {
      setSuccessMessage('');
      await deleteHaccpAttachment({
        tenantCode,
        approvalId: normalizedApprovalId,
        attachmentId: deleteTarget.attachmentId,
      });
      if (onChanged) {
        await onChanged();
      }
      await loadAttachments();
      setSuccessMessage('첨부파일이 삭제되었습니다.');
      setDeleteTarget(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '첨부파일 삭제에 실패했습니다.',
      );
    }
  };

  const attachmentSummary = useMemo(() => {
    if (isPendingMode) {
      return pendingFiles.length
        ? `대기 ${pendingFiles.length}개 첨부파일`
        : '첨부파일이 없습니다.';
    }
    if (!attachments.length) {
      return '첨부파일이 없습니다.';
    }
    return `${attachments.length}개 첨부파일`;
  }, [attachments.length, isPendingMode, pendingFiles.length]);

  const getStatusChipProps = (status: string | undefined) => {
    const normalized = (status ?? 'PENDING').toUpperCase();
    if (normalized === 'COMPLETED') {
      return { label: '완료', color: 'success' as const };
    }
    if (normalized === 'ABANDONED' || normalized === 'FAILED') {
      return { label: normalized, color: 'error' as const };
    }
    if (normalized === 'DELETED') {
      return { label: '삭제됨', color: 'default' as const };
    }
    return { label: '대기중', color: 'warning' as const };
  };

  const formatFileSize = (fileSize: number | undefined) => {
    if (!fileSize || fileSize <= 0) {
      return '-';
    }

    if (fileSize < 1024) {
      return `${fileSize} B`;
    }

    const kb = fileSize / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'panel.border',
        background: (theme) => theme.palette.panel.background,
        boxShadow: (theme) => theme.palette.panel.shadow,
        p: { xs: 1.75, sm: 2.25 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 1.75 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'panel.iconBg',
              color: 'info.main',
            }}
          >
            <FileUp  />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              첨부파일
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {attachmentSummary}
            </Typography>
          </Box>
        </Stack>
        {!isReadOnly ? (
          <Button
            variant="contained"
            startIcon={<FileUp />}
            onClick={() => inputRef.current?.click()}
            disabled={loading || (!canUseAttachmentApi && !isPendingMode)}
            sx={{
              borderRadius: 2,
              px: 1.75,
              boxShadow: (theme) => theme.palette.panel.buttonShadow,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            {!canUseAttachmentApi && !isPendingMode
              ? '문서 생성 후 업로드 가능'
              : loading
                ? '업로드 중...'
                : '파일 선택'}
          </Button>
        ) : null}
      </Stack>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        aria-label="첨부파일 선택"
        onChange={handleSelectFiles}
      />

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
          {successMessage}
        </Alert>
      ) : null}

      {isPendingMode ? (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          선택한 파일은 임시저장 또는 결재신청 시 함께 업로드됩니다.
        </Alert>
      ) : !canUseAttachmentApi ? (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          결재 문서 저장 후 첨부파일 기능을 사용할 수 있습니다.
        </Alert>
      ) : null}

      {isPendingMode && pendingFiles.length ? (
        <List dense disablePadding sx={{ display: 'grid', gap: 1 }}>
          {pendingFiles.map((file, index) => (
            <ListItem
              key={`${file.name}-${index}`}
              disableGutters
              sx={{
                px: 1.1,
                py: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'panel.itemBorder',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ width: '100%' }}
              >
                <Chip
                  label="저장 시 업로드"
                  color="info"
                  size="small"
                  sx={{ width: 'fit-content', fontWeight: 700 }}
                />
                <ListItemText
                  primary={file.name}
                  secondary={`${file.type || '알 수 없는 파일 타입'} / ${formatFileSize(file.size)}`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  sx={{ my: 0 }}
                />
                {!isReadOnly ? (
                  <Tooltip title="삭제">
                    <IconButton
                      size="small"
                      aria-label="remove pending attachment"
                      onClick={() => handleRemovePendingFile(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <Trash  />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </ListItem>
          ))}
        </List>
      ) : !isPendingMode && attachments.length ? (
        <List dense disablePadding sx={{ display: 'grid', gap: 1 }}>
          {attachments.map((attachment) => {
            const statusChip = getStatusChipProps(attachment.uploadStatus);
            return (
              <ListItem
                key={attachment.attachmentId ?? attachment.uploadToken}
                disableGutters
                sx={{
                  px: 1.1,
                  py: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'panel.itemBorder',
                  bgcolor: 'panel.itemBg',
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => theme.palette.panel.itemHoverShadow,
                  },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ width: '100%' }}
                >
                  <Chip
                    label={statusChip.label}
                    color={statusChip.color}
                    size="small"
                    sx={{ width: 'fit-content', fontWeight: 700 }}
                  />
                  <ListItemText
                    primary={
                      attachment.fileName ??
                      attachment.originalFileName ??
                      '첨부파일'
                    }
                    secondary={`${attachment.contentType ?? '알 수 없는 파일 타입'} · ${formatFileSize(attachment.fileSize)}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ sx: { mt: 0.15 } }}
                    sx={{ my: 0 }}
                  />
                  <Stack
                    direction="row"
                    spacing={0.25}
                    justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
                  >
                    {attachment.previewableYn === 'Y' ? (
                      <Tooltip title="미리보기">
                        <IconButton
                          size="small"
                          aria-label="preview attachment"
                          onClick={() => handlePreview(attachment)}
                        >
                          <Eye  />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="다운로드">
                      <IconButton
                        size="small"
                        aria-label="download attachment"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download  />
                      </IconButton>
                    </Tooltip>
                    {!isReadOnly ? (
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          aria-label="delete attachment"
                          onClick={() => handleDelete(attachment)}
                          sx={{ color: 'error.main' }}
                        >
                          <Trash  />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Box
          sx={{
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'panel.emptyBorder',
            bgcolor: 'panel.emptyBg',
            py: 2.5,
            px: 1.25,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            업로드된 첨부파일이 없습니다.
          </Typography>
        </Box>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="첨부파일 삭제 확인"
        description={
          deleteTarget
            ? `'${deleteTarget.fileName ?? deleteTarget.originalFileName ?? '첨부파일'}' 파일을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`
            : '첨부파일을 삭제하시겠습니까?'
        }
        confirmText="삭제"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
