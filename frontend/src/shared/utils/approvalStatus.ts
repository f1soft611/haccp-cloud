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
    statusName === '결재진행중' ||
    statusName === '결재중' ||
    todoStatus === 'in_progress'
  ) {
    return { label: '결재진행중', color: 'warning' };
  }

  if (
    status === 'rejected' ||
    status === 'returned' ||
    statusName === '반려' ||
    statusName === '반송'
  ) {
    return { label: '반려', color: 'error' };
  }

  if (status === 'pre_apply' || statusName === '임시저장') {
    return { label: '임시저장', color: 'info' };
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
