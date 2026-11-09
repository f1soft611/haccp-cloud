import { Chip } from '@mui/material';
import { APPROVAL_STATUS_COLORS, getApprovalChipPaddingX } from '../../utils/approvalStatus';

// 진행상태 라벨(미작성, 결재진행중, 승인, 반려)
export function ApprovalStatusChip({ label }: { label: string }) {
  const style = APPROVAL_STATUS_COLORS[label] ?? APPROVAL_STATUS_COLORS['미작성'];
  return (
    <Chip
      size="small"
      label={label}
        sx={{
          height: 24,
          borderRadius: '17px',
          fontSize: 12,
          fontWeight: 700,
          bgcolor: style.bg,
          color: style.color,
          border: label === '미작성' ? '1px solid #FFFFFF' : 'none',
          '& .MuiChip-label': { px: getApprovalChipPaddingX(label) },
        }}
    />
  );
}