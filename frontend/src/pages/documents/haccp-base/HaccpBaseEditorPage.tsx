import {
  Alert,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listHaccpBaseWorks } from '../../../services/documents/haccpBaseWorkService';
import { useAuthStore } from '../../../shared/store/authStore';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
  getWorkDocumentState,
  setWorkDocumentState,
} from '../../../services/documents/haccpBaseWorkUiStateService';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';

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

  const initialDocumentState = baseId ? getWorkDocumentState(baseId) : null;
  const [created, setCreated] = useState(
    Boolean(initialDocumentState?.created),
  );

  const save = () => {
    if (!baseId) {
      return;
    }
    setWorkDocumentState(baseId, created);
    showSuccess(
      created
        ? '문서 생성 상태로 저장되었습니다.'
        : '문서 미생성 상태로 저장되었습니다.',
    );
    navigate('/docs/haccp-base');
  };

  return (
    <Stack spacing={2} data-testid="haccp-base-editor-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="문서생성/편집"
        description="내용이 많은 부가 기능을 모달이 아닌 전용 페이지에서 작업합니다."
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

          <FormControlLabel
            control={
              <Switch
                checked={created}
                onChange={(event) => setCreated(event.target.checked)}
                disabled={!baseId || !targetWork}
              />
            }
            label={created ? '문서 생성됨' : '문서 미생성'}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={save}
              disabled={!baseId || !targetWork}
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
