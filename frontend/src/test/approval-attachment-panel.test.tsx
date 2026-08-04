import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApprovalAttachmentPanel } from '../pages/documents/approvals/components/ApprovalAttachmentPanel';

const {
  listHaccpAttachmentsMock,
  presignHaccpAttachmentsUploadMock,
  completeHaccpAttachmentsUploadMock,
} = vi.hoisted(() => ({
  listHaccpAttachmentsMock: vi.fn(),
  presignHaccpAttachmentsUploadMock: vi.fn(),
  completeHaccpAttachmentsUploadMock: vi.fn(),
}));

vi.mock('../services/documents/haccpAttachmentService', () => ({
  listHaccpAttachments: listHaccpAttachmentsMock,
  presignHaccpAttachmentsUpload: presignHaccpAttachmentsUploadMock,
  completeHaccpAttachmentsUpload: completeHaccpAttachmentsUploadMock,
  deleteHaccpAttachment: vi.fn().mockResolvedValue(undefined),
  presignHaccpAttachmentDownload: vi
    .fn()
    .mockResolvedValue({ downloadUrl: 'https://example.invalid/download' }),
  presignHaccpAttachmentPreview: vi
    .fn()
    .mockResolvedValue({ previewUrl: 'https://example.invalid/preview' }),
}));

describe('ApprovalAttachmentPanel', () => {
  it('uploads a file and shows it in the list', async () => {
    listHaccpAttachmentsMock.mockResolvedValueOnce({ items: [] });
    listHaccpAttachmentsMock.mockResolvedValueOnce({
      items: [
        {
          attachmentId: 11,
          originalFileName: 'a.pdf',
          uploadStatus: 'COMPLETED',
        },
      ],
    });
    presignHaccpAttachmentsUploadMock.mockResolvedValueOnce({
      items: [
        {
          uploadToken: 't1',
          objectKey: 'uploads/1/a.pdf',
          uploadUrl: 'https://example.invalid/upload',
          fileName: 'a.pdf',
          contentType: 'application/pdf',
          fileSize: 1,
        },
      ],
    });
    completeHaccpAttachmentsUploadMock.mockResolvedValueOnce({
      items: [
        {
          attachmentId: 11,
          originalFileName: 'a.pdf',
          uploadStatus: 'COMPLETED',
        },
      ],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );

    const user = userEvent.setup();
    render(<ApprovalAttachmentPanel tenantCode="PLATFORM" approvalId="100" />);

    const file = new File(['hello'], 'a.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('첨부파일 선택') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('a.pdf')).toBeInTheDocument();
    });
  });
});
