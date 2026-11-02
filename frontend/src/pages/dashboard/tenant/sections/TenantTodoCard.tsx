import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, Card, CardActions, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resolveApprovalStatusView } from '../../../../shared/utils/approvalStatus';
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import { useOpenWorkDraft } from '../../../../shared/hooks/useOpenWorkDraft';
import type { TenantTodoCardItem } from '../hooks/useTenantDashboardData';
import { getWorkCycleSx } from '../utils';

type TenantTodoCardProps = {
  item: TenantTodoCardItem;
  sectionLabel: string;
  pendingApproval?: boolean;
};

export function TenantTodoCard({ item, sectionLabel, pendingApproval = false }: TenantTodoCardProps) {
  const navigate = useNavigate();
  const { openWorkDraft, dialog } = useOpenWorkDraft();

  const { label: statusLabel, color: statusColor } = pendingApproval
    ? { label: '결재할문서', color: 'secondary' as const }
    : resolveApprovalStatusView({
        approvalStatusType: item.approvalStatusType,
        approvalStatusTypeName: item.approvalStatusTypeName,
        todoStatus: item.status,
        writtenInCycle: item.writtenInCycle,
      });

  const dDayColor = item.dDay.startsWith('D+')
    ? 'error.main'
    : item.dDay === 'D-Day'
      ? 'warning.main'
      : 'text.secondary';

  return (
    <>
      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: 'divider' }}>
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary" noWrap>{sectionLabel}</Typography>
            <Chip size="small" label={statusLabel} color={statusColor} sx={{ height: 20, fontWeight: 700 }} />
          </Stack>

          <Typography variant="subtitle2" fontWeight={700} mb={1.5} noWrap>
            {item.divisionName || item.title || '-'}
          </Typography>

          <Stack spacing={0.5}>
            <InfoRow label="검토자" value={item.reviewerName || '-'} />
            <InfoRow label="결재자" value={item.approverName || '-'} />
            <InfoRow label="최근 작성일" value={item.updatedAt || '-'} />
            <InfoRow label="최근 작성자" value={item.lastWriterName || '-'} />
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
            {item.dDay ? (
              <Typography variant="body2" fontWeight={700} color={dDayColor}>{item.dDay}</Typography>
            ) : (
              <Box />
            )}
            <Chip
              size="small"
              label={item.cycleName || item.cycle || '-'}
              sx={{ height: 22, fontWeight: 700, ...getWorkCycleSx(item.cycle) }}
            />
          </Stack>
        </CardContent>

        <Divider />

        <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              if (!pendingApproval) {
                void openWorkDraft(item.id);
                return;
              }
              const path = resolveDraftRoute(item);
              if (path) navigate(path);
            }}
          >
            오늘 작성
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={item.unwrittenCount > 0 ? 'error' : 'inherit'}
            startIcon={item.unwrittenCount > 0 ? <ErrorOutlineIcon /> : undefined}
            onClick={() => {
              // ponytail: 미작성 목록 화면은 별도 설계 예정, 일단 HACCP 문서 목록으로 이동
              const query = new URLSearchParams({ workType: sectionLabel, workDivisionId: item.id });
              navigate(`/docs/haccp-doc?${query.toString()}`);
            }}
          >
            미작성 {item.unwrittenCount}건
          </Button>
        </CardActions>
      </Card>
      {dialog}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>{label}</Typography>
      <Typography variant="caption" noWrap>{value}</Typography>
    </Stack>
  );
}
