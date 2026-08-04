import {
  Alert,
  alpha,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import PreviewIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  completeHaccpAttachmentsUpload,
  deleteHaccpAttachment,
  listHaccpAttachments,
  presignHaccpAttachmentsUpload,
  presignHaccpAttachmentDownload,
  presignHaccpAttachmentPreview,
  type HaccpAttachmentItem,
} from '../../../../services/documents/haccpAttachmentService';
import { extractApiErrorMessage } from '../../../../services/api/errorMessage';
import { ConfirmDialog } from '../../../../shared/components/feedback/ConfirmDialog';

type ApprovalAttachmentPanelProps = {
  tenantCode: string;
  approvalId: string;
  isReadOnly?: boolean;
  onChanged?: () => void | Promise<void>;
};

export function ApprovalAttachmentPanel(props: ApprovalAttachmentPanelProps) {
  const { tenantCode, approvalId, isReadOnly = false, onChanged } = props;
  const normalizedApprovalId = String(approvalId || '').trim();
  const canUseAttachmentApi = normalizedApprovalId.length > 0;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<HaccpAttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HaccpAttachmentItem | null>(
    null,
  );

  const extractStorageErrorMessage = (rawText: string) => {
    const messageMatch = rawText.match(/<Message>([^<]+)<\/Message>/i);
    if (messageMatch?.[1]) {
      return messageMatch[1].trim();
    }

    const codeMatch = rawText.match(/<Code>([^<]+)<\/Code>/i);
    if (codeMatch?.[1]) {
      return codeMatch[1].trim();
    }

    return rawText.trim();
  };

  const resolveStorageUploadErrorMessage = async (response: Response) => {
    let responseText = '';
    try {
      responseText = await response.text();
    } catch {
      responseText = '';
    }

    const parsedMessage = responseText
      ? extractStorageErrorMessage(responseText)
      : '';

    if (parsedMessage) {
      return `파일 업로드 저장소 전송에 실패했습니다. (${response.status}) ${parsedMessage}`;
    }

    return `파일 업로드 저장소 전송에 실패했습니다. (${response.status})`;
  };

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
    if (!files.length) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!canUseAttachmentApi) {
      setLoading(false);
      setErrorMessage('결재 문서가 생성된 후 첨부파일을 업로드할 수 있습니다.');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    try {
      const presigned = await presignHaccpAttachmentsUpload({
        tenantCode,
        approvalId: normalizedApprovalId,
        items: files.map((file) => ({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
        })),
      });

      const uploadResults = await Promise.all(
        presigned.items.map(async (item, index) => {
          const file = files[index];
          if (!file) {
            return null;
          }

          if (item.uploadUrl) {
            const uploadHeaders: Record<string, string> = {
              ...(item.requiredHeaders ?? {}),
            };
            if (!uploadHeaders['Content-Type']) {
              uploadHeaders['Content-Type'] =
                file.type || 'application/octet-stream';
            }

            const uploadResponse = await fetch(item.uploadUrl, {
              method: 'PUT',
              body: file,
              headers: uploadHeaders,
            });
            if (!uploadResponse.ok) {
              throw new Error(
                await resolveStorageUploadErrorMessage(uploadResponse),
              );
            }
          }

          return {
            uploadToken: item.uploadToken ?? '',
            objectKey: item.objectKey ?? '',
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            fileSize: file.size,
          };
        }),
      );

      const completePayload = uploadResults.filter(
        (item): item is NonNullable<typeof item> => Boolean(item),
      );

      if (completePayload.length) {
        await completeHaccpAttachmentsUpload({
          tenantCode,
          approvalId: normalizedApprovalId,
          items: completePayload,
        });
        if (onChanged) {
          await onChanged();
        }
        setSuccessMessage('첨부파일 업로드가 완료되었습니다.');
      }

      await loadAttachments();
    } catch (error) {
      const networkLikelyIssue =
        error instanceof TypeError &&
        /failed to fetch|networkerror|load failed/i.test(error.message);

      setErrorMessage(
        networkLikelyIssue
          ? '스토리지 업로드 연결에 실패했습니다. MinIO(218.155.74.34:9000) 실행/CORS 설정을 확인해주세요.'
          : extractApiErrorMessage(error, '첨부파일 업로드에 실패했습니다.'),
      );
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
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
    if (!attachments.length) {
      return '첨부파일이 없습니다.';
    }
    return `${attachments.length}개 첨부파일`;
  }, [attachments.length]);

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
        borderColor: (theme) =>
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.12)
            : alpha(theme.palette.primary.main, 0.14),
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${alpha('#0f172a', 0.96)} 0%, ${alpha('#111827', 0.96)} 100%)`
            : `linear-gradient(145deg, ${alpha('#f8fafc', 0.96)} 0%, ${alpha('#f1f5f9', 0.9)} 100%)`,
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? `0 16px 36px ${alpha('#020617', 0.45)}`
            : `0 16px 34px ${alpha('#0f172a', 0.08)}`,
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
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.info.light, 0.14)
                  : alpha(theme.palette.info.main, 0.12),
              color: 'info.main',
            }}
          >
            <FileUploadIcon fontSize="small" />
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
            startIcon={<FileUploadIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={loading || !canUseAttachmentApi}
            sx={{
              borderRadius: 2,
              px: 1.75,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? `0 8px 18px ${alpha(theme.palette.primary.dark, 0.45)}`
                  : `0 10px 20px ${alpha(theme.palette.primary.main, 0.26)}`,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            {!canUseAttachmentApi
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

      {!canUseAttachmentApi ? (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          결재 문서 저장 후 첨부파일 기능을 사용할 수 있습니다.
        </Alert>
      ) : null}

      {attachments.length ? (
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
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.08)
                      : alpha(theme.palette.common.black, 0.08),
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.03)
                      : alpha(theme.palette.common.white, 0.88),
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? `0 8px 16px ${alpha('#020617', 0.3)}`
                        : `0 10px 18px ${alpha('#0f172a', 0.08)}`,
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
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="다운로드">
                      <IconButton
                        size="small"
                        aria-label="download attachment"
                        onClick={() => handleDownload(attachment)}
                      >
                        <DownloadIcon fontSize="small" />
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
                          <DeleteOutlineIcon fontSize="small" />
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
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.18)
                : alpha(theme.palette.primary.main, 0.24),
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.white, 0.75),
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
