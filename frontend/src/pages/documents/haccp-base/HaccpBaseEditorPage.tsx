import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/core';
import { listHaccpBaseWorks } from '../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../shared/store/authStore';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { setWorkDocumentState } from '../../../services/documents/haccpBaseWorkUiStateService';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { NotionLikeEditor } from '../../../editor/components/NotionLikeEditor';
import { useEditorDocument } from '../../../editor/hooks/useEditorDocument';

export function HaccpBaseEditorPage() {
  const navigate = useNavigate();
  const { baseId } = useParams();
  const { showSuccess } = useFeedback();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');

  const worksQuery = useQuery({
    queryKey: ['haccp-base-works', tenantCode],
    queryFn: () => listHaccpBaseWorks({ tenantCode }),
    retry: false,
  });

  const targetWork = useMemo(
    () => (worksQuery.data ?? []).find((item) => item.id === (baseId ?? '')),
    [worksQuery.data, baseId],
  );

  const { content, setContent, saveDocument, isCreated, canEdit } =
    useEditorDocument({
      docId: baseId ?? '',
    });

  const [isSaving, setIsSaving] = useState(false);

  const handleChangeContent = (nextContent: JSONContent) => {
    setContent(nextContent);
  };

  const save = async () => {
    if (!baseId) {
      return;
    }

    setIsSaving(true);
    saveDocument(content);
    setWorkDocumentState(baseId, isCreated);
    showSuccess(
      isCreated
        ? '문서 생성 상태로 저장되었습니다.'
        : '문서 미생성 상태로 저장되었습니다.',
    );
    setIsSaving(false);
    navigate('/docs/haccp-base');
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
              onClick={() => navigate('/docs/haccp-base')}
            >
              목록으로
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
