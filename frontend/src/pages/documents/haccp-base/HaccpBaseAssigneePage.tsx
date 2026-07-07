import { Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';

export function HaccpBaseAssigneePage() {
  const navigate = useNavigate();
  const { baseId } = useParams();

  return (
    <Stack spacing={2} data-testid="haccp-base-assignee-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="담당자 설정"
        description="양식 담당자 정보를 페이지에서 상세하게 관리합니다."
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body1" fontWeight={600}>
            대상 양식 ID: {baseId || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            부가 화면은 모달 대신 독립 페이지로 분리되었습니다. 실제 담당자 매핑
            폼은 이 페이지에 확장 구현하면 됩니다.
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
