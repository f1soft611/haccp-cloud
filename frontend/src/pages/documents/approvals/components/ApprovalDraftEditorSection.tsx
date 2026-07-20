import { Box, Chip, Divider, Paper, Stack, TextField } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import type { ReactNode } from 'react';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import { NotionLikeEditor } from '../../../../editor/components/NotionLikeEditor';
import type { DocumentFieldValues } from '../../../../editor/utils/documentFieldValues';
import { formatNow } from '../utils/approvalDraftUtils';

function resolveApprovalStatusLabel(status: string): string {
  if (status === 'in_progress') {
    return '결재진행중';
  }
  if (status === 'approved') {
    return '승인';
  }
  if (status === 'rejected' || status === 'returned') {
    return '반려';
  }
  if (status === 'pre_apply') {
    return '임시저장';
  }
  return '미작성';
}

function resolveApprovalStatusColor(status: string): ChipProps['color'] {
  if (status === 'in_progress') {
    return 'warning';
  }
  if (status === 'approved') {
    return 'success';
  }
  if (status === 'rejected' || status === 'returned') {
    return 'secondary';
  }
  if (status === 'pre_apply') {
    return 'info';
  }
  return 'default';
}

type ApprovalDraftEditorSectionProps = {
  baseId?: string;
  idType: 'work' | 'approval';
  work?: HaccpBaseWorkItem;
  title: string;
  onTitleChange: (next: string) => void;
  displayName: string;
  userId: string;
  metadataSection?: ReactNode;
  content: JSONContent;
  onChangeEditor: (nextContent: JSONContent, nextHtml: string) => void;
  documentFieldValues: DocumentFieldValues;
};

export function ApprovalDraftEditorSection(
  props: ApprovalDraftEditorSectionProps,
) {
  const {
    baseId,
    idType,
    work,
    title,
    onTitleChange,
    displayName,
    userId,
    metadataSection,
    content,
    onChangeEditor,
    documentFieldValues,
  } = props;

  const templateId =
    (work?.id || (idType === 'work' ? baseId : '') || '-').trim() || '-';
  const documentId =
    (work?.approvalId || (idType === 'approval' ? baseId : '') || '-').trim() ||
    '-';
  const approvalStatus = String(work?.approvalStatusType ?? '')
    .trim()
    .toLowerCase();
  const statusLabel = resolveApprovalStatusLabel(approvalStatus);
  const statusColor = resolveApprovalStatusColor(approvalStatus);
  const draftNumber =
    approvalStatus && approvalStatus !== 'pre_apply'
      ? (work?.draftNumber || '').trim()
      : '';

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.75}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="info"
              variant="outlined"
              label={`템플릿명 ${work?.divisionName || '-'}`}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`템플릿 ID ${templateId}`}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`문서 ID ${documentId}`}
            />
          </Stack>

          <Chip
            size="small"
            color={statusColor}
            variant="filled"
            label={`${statusLabel}`}
            sx={{ ml: { md: 'auto' }, fontWeight: 700 }}
          />
        </Stack>

        <Divider />

        {metadataSection}

        <Divider />

        <Stack
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          <TextField
            label="기안 제목"
            placeholder="예: 2026-07-16 품질 점검 기안"
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            fullWidth
            sx={{
              minWidth: 0,
              gridColumn: { xs: '1 / -1', md: '1 / span 2' },
            }}
          />
          <TextField
            label="기안번호"
            value={draftNumber}
            placeholder="결재 신청 시 자동 생성"
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ minWidth: 0 }}
          />

          <TextField
            label="기안자"
            value={displayName || userId}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 0 }}
          />
          <TextField
            label="기안일"
            value={formatNow(new Date())}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 0 }}
          />
          <TextField
            label="구분"
            value={work?.categoryName || '-'}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 0 }}
          />
        </Stack>

        <Box sx={{ py: 1 }}>
          <Box sx={{ width: '100%' }}>
            <NotionLikeEditor
              content={content}
              editable
              showToolbar={false}
              enableSlashCommand={false}
              documentFieldDisplayMode="value"
              canvasMinHeight={0}
              editorMinHeight={0}
              paperSx={{
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
              }}
              onChange={onChangeEditor}
              documentFieldValues={documentFieldValues}
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
