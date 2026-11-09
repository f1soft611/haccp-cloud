import { Chip } from '@mui/material';
import { APPROVAL_STATUS_COLORS, getApprovalChipPaddingX } from '../../utils/approvalStatus';
import styles from '../sharedComponents.module.css';

// 진행상태 라벨(미작성, 결재진행중, 승인, 반려)
export function ApprovalStatusChip({ label }: { label: string }) {
  const style = APPROVAL_STATUS_COLORS[label] ?? APPROVAL_STATUS_COLORS['미작성'];
  return (
    <Chip
      size="small"
      label={label}
      className={`${styles.scope} ${styles.approvalChip}`}
      data-unwritten={label === '미작성'}
      sx={{
        bgcolor: style.bg,
        color: style.color,
        '& .MuiChip-label': { px: getApprovalChipPaddingX(label) },
      }}
    />
  );
}