import { Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';

export function HaccpBaseEditorPage() {
  const navigate = useNavigate();
  const { baseId } = useParams();

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
          <Typography variant="body2" color="text.secondary">
            문서 본문 작성, 템플릿 블록 구성, 버전관리 같은 확장 기능을 이
            페이지 단위로 추가할 수 있습니다.
          </Typography>
          <Stack direction="row" spacing={1}>
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
