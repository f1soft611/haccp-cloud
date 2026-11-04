export type ApprovalStatusChipColor =
  | 'default'
  | 'success'
  | 'info'
  | 'warning'
  | 'secondary'
  | 'error';

export type ApprovalStatusView = {
  label: string;
  color: ApprovalStatusChipColor;
};

function normalizeStatus(value: string | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function resolveApprovalStatusView(params: {
  approvalStatusType?: string;
  approvalStatusTypeName?: string;
  todoStatus?: string;
  writtenInCycle?: boolean;
}): ApprovalStatusView {
  const status = normalizeStatus(params.approvalStatusType);
  const statusName = normalizeStatus(params.approvalStatusTypeName);
  const todoStatus = normalizeStatus(params.todoStatus);

  if (
    status === 'approved' ||
    statusName === '승인' ||
    todoStatus === 'active'
  ) {
    return { label: '승인', color: 'success' };
  }

  if (
    status === 'in_progress' ||
    // 기존 -> statusName === '결재진행중' || statusName === '결재중'
    // 변경 -> statusName === '결재진행중' (SQL 이 더 이상 '결재중'을 내보내지 않음)
    statusName === '결재진행중' ||
    todoStatus === 'in_progress'
  ) {
    return { label: '결재진행중', color: 'warning' };
  }

  if (
    status === 'rejected' ||
    status === 'returned' ||
    // 기존 -> statusName === '반려' || statusName === '반송'
    // 변경 -> statusName === '반려'
    statusName === '반려'
  ) {
    return { label: '반려', color: 'error' };
  }

  if (status === 'pre_apply' || statusName === '임시저장') {
    return { label: '미작성', color: 'default' };
  }

  if (
    todoStatus === 'draft' ||
    statusName === '미작성' ||
    statusName === '미완료' ||
    params.writtenInCycle
  ) {
    return { label: '미작성', color: 'default' };
  }

  return { label: '미작성', color: 'default' };
}

export const PENDING_APPROVAL_LABEL = '결재할문서';

export const APPROVAL_STATUS_COLORS: Record<
  string,
  { bg: string; color: string; suffix?: { text: string; color: string } }
> = {
  미작성: { bg: '#E9EFF1', color: '#879499' },
  [PENDING_APPROVAL_LABEL]: { bg: '#D9F3FC', color: '#087DBD' },
  결재진행중: { bg: '#D8F4E9', color: '#079E63', suffix: { text: '(결재진행중)', color: '#079E63' } },
  승인: { bg: '#D8F4E9', color: '#079E63', suffix: { text: '(승인)', color: '#0094D5' } },
  반려: { bg: '#D8F4E9', color: '#079E63', suffix: { text: '(반려)', color: '#D6004F' } },
};
