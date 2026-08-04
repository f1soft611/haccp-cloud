import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  deleteHaccpWorkApprovalComment,
  updateHaccpWorkApprovalComment,
  toggleHaccpWorkApprovalCommentLike,
} from '../services/documents/haccpBaseWorkService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    patch: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(apiClient.patch).mockReset();
  vi.mocked(apiClient.delete).mockReset();
  vi.mocked(apiClient.post).mockReset();
});

describe('haccpBaseWorkService approval comments', () => {
  it('calls the comment update endpoint', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { message: 'ok' } });

    await updateHaccpWorkApprovalComment({
      tenantCode: 'TENANT-A',
      approvalId: '100',
      commentId: '200',
      comment: '수정된 의견',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/v1/haccp-work/approvals/100/comments/200',
      { comment: '수정된 의견' },
      { headers: { 'x-tenant-code': 'TENANT-A' } },
    );
  });

  it('calls the comment delete endpoint', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { message: 'ok' } });

    await deleteHaccpWorkApprovalComment({
      tenantCode: 'TENANT-A',
      approvalId: '100',
      commentId: '200',
    });

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/v1/haccp-work/approvals/100/comments/200',
      { headers: { 'x-tenant-code': 'TENANT-A' } },
    );
  });

  it('calls the comment like toggle endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'ok' } });

    await toggleHaccpWorkApprovalCommentLike({
      tenantCode: 'TENANT-A',
      approvalId: '100',
      commentId: '200',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/haccp-work/approvals/100/comments/200/likes',
      {},
      { headers: { 'x-tenant-code': 'TENANT-A' } },
    );
  });
});
