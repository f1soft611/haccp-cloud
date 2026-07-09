import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import PreviewRounded from '@mui/icons-material/PreviewRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/core';
import {
  getHaccpBaseWorkById,
  saveHaccpBaseWorkTemplate,
} from '../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../shared/store/authStore';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { setWorkDocumentState } from '../../../services/documents/haccpBaseWorkUiStateService';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { NotionLikeEditor } from '../../../editor/components/NotionLikeEditor';
import { hasVisibleContent } from '../../../editor/utils/documentStorage';

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function parseTemplateJson(value: string | undefined): JSONContent {
  if (!value || value.trim().length === 0) {
    return EMPTY_DOC;
  }

  try {
    return JSON.parse(value) as JSONContent;
  } catch {
    return EMPTY_DOC;
  }
}

export function HaccpBaseEditorPage() {
  const navigate = useNavigate();
  const { baseId } = useParams();
  const { showSuccess } = useFeedback();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');

  const workDetailQuery = useQuery({
    queryKey: ['haccp-base-work-detail', tenantCode, baseId],
    queryFn: () =>
      getHaccpBaseWorkById({
        tenantCode,
        id: baseId ?? '',
      }),
    enabled: Boolean(baseId),
    retry: false,
  });

  const targetWork = workDetailQuery.data;

  const [content, setContent] = useState<JSONContent>(EMPTY_DOC);
  const [contentHtml, setContentHtml] = useState('');
  const canEdit = useMemo(() => (baseId ?? '').trim().length > 0, [baseId]);
  const isCreated = useMemo(() => hasVisibleContent(content), [content]);

  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!targetWork) {
      setContent(EMPTY_DOC);
      setContentHtml('');
      return;
    }

    setContent(parseTemplateJson(targetWork.templateJson));
    setContentHtml(targetWork.templateHtml ?? '');
  }, [targetWork]);

  const handleChangeContent = (nextContent: JSONContent, nextHtml: string) => {
    setContent(nextContent);
    setContentHtml(nextHtml);
  };

  const save = async () => {
    if (!baseId) {
      return;
    }

    setIsSaving(true);
    try {
      await saveHaccpBaseWorkTemplate({
        tenantCode,
        id: baseId,
        templateJson: JSON.stringify(content),
        templateHtml: contentHtml,
      });

      setWorkDocumentState(baseId, isCreated);
      showSuccess(
        isCreated
          ? '문서 생성 상태로 저장되었습니다.'
          : '문서 미생성 상태로 저장되었습니다.',
      );
      navigate('/docs/haccp-base');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack spacing={2} data-testid="haccp-base-editor-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="문서생성/편집"
        description="1~3단계: 기본 에디터, 툴바/버블 메뉴, 슬래시 명령을 적용한 문서 편집 페이지입니다."
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body1" fontWeight={600}>
            대상 양식 ID: {baseId || '-'}
          </Typography>

          {targetWork ? (
            <Typography variant="body2" color="text.secondary">
              {targetWork.divisionCode}.{targetWork.divisionName}
            </Typography>
          ) : null}

          {!baseId || !targetWork ? (
            <Alert severity="warning">대상 업무를 찾을 수 없습니다.</Alert>
          ) : null}

          <NotionLikeEditor
            content={content}
            editable={canEdit && Boolean(targetWork)}
            onChange={handleChangeContent}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="caption" color="text.secondary">
              안내: '/' 입력 시 슬래시 명령 메뉴를 사용할 수 있습니다.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={save}
                disabled={!baseId || !targetWork || isSaving}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewRounded />}
                onClick={() => setIsPreviewOpen(true)}
                disabled={!baseId || !targetWork}
              >
                미리보기
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBackRounded />}
                onClick={() => navigate('/docs/haccp-base')}
              >
                목록으로
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
          },
        }}
      >
        <DialogTitle>문서 미리보기</DialogTitle>
        <DialogContent dividers>
          {contentHtml.trim().length > 0 ? (
            <Box
              sx={{
                p: { xs: 1, md: 2 },
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: isDarkMode ? '#f8fafc' : 'grey.50',
                '& .tiptap': {
                  color: isDarkMode ? '#0f172a' : 'text.primary',
                  fontSize: 15,
                  lineHeight: 1.7,
                  wordBreak: 'break-word',
                },
                '& .tiptap h2': {
                  fontSize: 22,
                  lineHeight: 1.3,
                  mt: 3,
                  mb: 1,
                },
                '& .tiptap p': {
                  my: 1,
                },
                '& .tiptap ul[data-type="taskList"]': {
                  pl: 0,
                  listStyle: 'none',
                },
                '& .tiptap ul[data-type="taskList"] li': {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  my: 0.9,
                },
                '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: center"]), & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: center"])':
                  {
                    justifyContent: 'center',
                  },
                '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: right"]), & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: right"])':
                  {
                    justifyContent: 'flex-end',
                  },
                '& .tiptap ul[data-type="taskList"] li > label': {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '0 0 auto',
                  mt: '6px',
                  lineHeight: 1,
                },
                '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: right"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: right"]) > div':
                  {
                    flex: '0 1 auto',
                  },
                '& .tiptap ul[data-type="taskList"] li > label input': {
                  width: 16,
                  height: 16,
                  margin: 0,
                  pointerEvents: 'none',
                },
                '& .tiptap ul[data-type="taskList"] li > div': {
                  flex: 1,
                  minWidth: 0,
                },
                '& .tiptap ul[data-type="taskList"] li > div > p, & .tiptap ul[data-type="taskList"] li > p':
                  {
                    margin: 0,
                  },
                '& .tiptap table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  my: 2,
                  tableLayout: 'fixed',
                },
                '& .tiptap th, & .tiptap td': {
                  border: '1px solid',
                  borderColor: isDarkMode
                    ? 'rgba(15, 23, 42, 0.35)'
                    : 'divider',
                  p: 1,
                  verticalAlign: 'top',
                },
                '& .tiptap th': {
                  bgcolor: isDarkMode ? '#eef2f7' : 'common.white',
                  fontWeight: 700,
                },
              }}
            >
              <Box
                className="tiptap"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </Box>
          ) : (
            <Alert severity="info">미리볼 내용이 없습니다.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
