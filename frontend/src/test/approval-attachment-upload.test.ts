import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  syncApprovalAttachmentsAfterSave,
  uploadApprovalAttachments,
} from '../pages/documents/approvals/utils/approvalAttachmentUpload';

const {
  presignHaccpAttachmentsUploadMock,
  completeHaccpAttachmentsUploadMock,
  copyHaccpAttachmentsFromApprovalMock,
} = vi.hoisted(() => ({
  presignHaccpAttachmentsUploadMock: vi.fn(),
  completeHaccpAttachmentsUploadMock: vi.fn(),
  copyHaccpAttachmentsFromApprovalMock: vi.fn(),
}));

vi.mock('../services/documents/haccpAttachmentService', () => ({
  presignHaccpAttachmentsUpload: presignHaccpAttachmentsUploadMock,
  completeHaccpAttachmentsUpload: completeHaccpAttachmentsUploadMock,
  copyHaccpAttachmentsFromApproval: copyHaccpAttachmentsFromApprovalMock,
}));

const fileA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
const fileB = new File(['b'], 'b.pdf', { type: 'application/pdf' });

beforeEach(() => {
  vi.clearAllMocks();
  presignHaccpAttachmentsUploadMock.mockResolvedValue({
    items: [
      { uploadToken: 't1', objectKey: 'k1', uploadUrl: 'https://example.invalid/1' },
      { uploadToken: 't2', objectKey: 'k2', uploadUrl: 'https://example.invalid/2' },
    ],
  });
  completeHaccpAttachmentsUploadMock.mockResolvedValue({ items: [] });
  copyHaccpAttachmentsFromApprovalMock.mockResolvedValue(undefined);
});

describe('uploadApprovalAttachments', () => {
  it('completes only files whose storage upload succeeded', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 403, text: async () => '' }),
    );

    const result = await uploadApprovalAttachments({
      tenantCode: 'PLATFORM',
      approvalId: '200',
      files: [fileA, fileB],
    });

    expect(result).toMatchObject({ succeeded: 1, failed: 1 });
    expect(completeHaccpAttachmentsUploadMock).toHaveBeenCalledWith({
      tenantCode: 'PLATFORM',
      approvalId: '200',
      items: [expect.objectContaining({ uploadToken: 't1', fileName: 'a.pdf' })],
    });
  });
});

describe('syncApprovalAttachmentsAfterSave', () => {
  it('does nothing when there are no files and no source', async () => {
    const result = await syncApprovalAttachmentsAfterSave({
      tenantCode: 'PLATFORM',
      savedApprovalId: '200',
      files: [],
    });

    expect(result).toEqual({});
    expect(copyHaccpAttachmentsFromApprovalMock).not.toHaveBeenCalled();
    expect(presignHaccpAttachmentsUploadMock).not.toHaveBeenCalled();
  });

  it('copies rejected source attachments into the new document', async () => {
    const result = await syncApprovalAttachmentsAfterSave({
      tenantCode: 'PLATFORM',
      savedApprovalId: 200,
      sourceApprovalId: '100',
      files: [],
    });

    expect(result).toEqual({});
    expect(copyHaccpAttachmentsFromApprovalMock).toHaveBeenCalledWith({
      tenantCode: 'PLATFORM',
      approvalId: '200',
      sourceApprovalId: '100',
    });
  });

  it('skips copy when the save updated the source document itself', async () => {
    await syncApprovalAttachmentsAfterSave({
      tenantCode: 'PLATFORM',
      savedApprovalId: '100',
      sourceApprovalId: '100',
      files: [],
    });

    expect(copyHaccpAttachmentsFromApprovalMock).not.toHaveBeenCalled();
  });

  it('returns a warning when copy fails but still uploads pending files', async () => {
    copyHaccpAttachmentsFromApprovalMock.mockRejectedValueOnce(new Error('boom'));
    presignHaccpAttachmentsUploadMock.mockResolvedValueOnce({
      items: [{ uploadToken: 't1', objectKey: 'k1', uploadUrl: 'https://example.invalid/1' }],
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const result = await syncApprovalAttachmentsAfterSave({
      tenantCode: 'PLATFORM',
      savedApprovalId: '200',
      sourceApprovalId: '100',
      files: [fileA],
    });

    expect(completeHaccpAttachmentsUploadMock).toHaveBeenCalledTimes(1);
    expect(result.warningMessage).toContain('반려 문서의 첨부파일을 가져오지 못했습니다.');
  });

  it('returns a warning when the saved approval id is missing', async () => {
    const result = await syncApprovalAttachmentsAfterSave({
      tenantCode: 'PLATFORM',
      savedApprovalId: '',
      files: [fileA],
    });

    expect(result.warningMessage).toContain('문서는 저장되었지만');
    expect(presignHaccpAttachmentsUploadMock).not.toHaveBeenCalled();
  });
});
