import { Box, Chip, Divider, Paper, Stack, TextField } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import type { ReactNode } from 'react';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import { NotionLikeEditor } from '../../../../editor/components/NotionLikeEditor';
import type { DocumentFieldValues } from '../../../../editor/utils/documentFieldValues';
import { formatNow } from '../utils/approvalDraftUtils';

type ApprovalDraftEditorSectionProps = {
  baseId?: string;
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
            label={`템플릿 ID ${baseId || '-'}`}
          />
        </Stack>

        <Divider />

        {metadataSection}

        <Divider />

        <Stack spacing={2}>
          <TextField
            label="기안 제목"
            placeholder="예: 2026-07-16 품질 점검 기안"
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            fullWidth
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              label="기안자"
              value={displayName || userId}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="기안일"
              value={formatNow(new Date())}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="구분"
              value={work?.categoryName || '-'}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />
          </Stack>
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
