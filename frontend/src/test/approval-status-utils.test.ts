import { describe, expect, it } from 'vitest';
import { resolveApprovalStatusView } from '../shared/utils/approvalStatus';

describe('resolveApprovalStatusView', () => {
  it('normalizes in-progress status to 결재진행중 with warning chip', () => {
    expect(
      resolveApprovalStatusView({ approvalStatusType: 'in_progress' }),
    ).toEqual({ label: '결재진행중', color: 'warning' });
  });

  it('normalizes unfinished work to 미작성 with default chip', () => {
    expect(resolveApprovalStatusView({ todoStatus: 'DRAFT' })).toEqual({
      label: '미작성',
      color: 'default',
    });
  });

  it('keeps written-in-cycle draft items as 미작성', () => {
    expect(
      resolveApprovalStatusView({
        todoStatus: 'DRAFT',
        writtenInCycle: true,
      }),
    ).toEqual({ label: '미작성', color: 'default' });
  });

  it('keeps pre-apply as 임시저장 with info chip', () => {
    expect(
      resolveApprovalStatusView({ approvalStatusType: 'pre_apply' }),
    ).toEqual({ label: '임시저장', color: 'info' });
  });
});
