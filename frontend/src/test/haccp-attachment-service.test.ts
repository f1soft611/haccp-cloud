import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  completeHaccpAttachmentsUpload,
  listHaccpAttachments,
  presignHaccpAttachmentDownload,
  presignHaccpAttachmentsUpload,
} from '../services/documents/haccpAttachmentService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(apiClient.post).mockReset();
  vi.mocked(apiClient.get).mockReset();
  vi.mocked(apiClient.delete).mockReset();
});

describe('haccpAttachmentService', () => {
  it('presign -> complete -> list flow returns normalized items', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              uploadToken: 'token-1',
              objectKey: 'uploads/a.pdf',
              uploadUrl: 'https://example/upload',
              fileName: 'a.pdf',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              attachmentId: 7,
              uploadStatus: 'COMPLETED',
              originalFileName: 'a.pdf',
            },
          ],
        },
      });

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        items: [
          {
            attachmentId: 7,
            uploadStatus: 'COMPLETED',
            originalFileName: 'a.pdf',
          },
        ],
      },
    });

    const presigned = await presignHaccpAttachmentsUpload({
      tenantCode: 'PLATFORM',
      approvalId: '100',
      items: [
        { fileName: 'a.pdf', contentType: 'application/pdf', fileSize: 123 },
      ],
    });

    const completed = await completeHaccpAttachmentsUpload({
      tenantCode: 'PLATFORM',
      approvalId: '100',
      items: [
        {
          uploadToken: 'token-1',
          objectKey: 'uploads/a.pdf',
          fileName: 'a.pdf',
          contentType: 'application/pdf',
          fileSize: 123,
        },
      ],
    });

    const listed = await listHaccpAttachments({
      tenantCode: 'PLATFORM',
      approvalId: '100',
    });

    expect(presigned.items[0].fileName).toBe('a.pdf');
    expect(completed.items[0].uploadStatus).toBe('COMPLETED');
    expect(listed.items[0].attachmentId).toBe(7);
  });

  it('reads downloadUrl from wrapped result payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        result: {
          downloadUrl: 'https://example.com/download/signed',
        },
      },
    });

    const response = await presignHaccpAttachmentDownload({
      tenantCode: 'PLATFORM',
      approvalId: '100',
      attachmentId: '7',
    });

    expect(response.downloadUrl).toBe('https://example.com/download/signed');
  });

  it('reads presign items from result.items envelope', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        result: {
          items: [
            {
              uploadToken: 'token-2',
              objectKey: 'uploads/b.pdf',
              uploadUrl: 'https://example/upload-b',
              originalFileName: 'b.pdf',
            },
          ],
        },
      },
    });

    const presigned = await presignHaccpAttachmentsUpload({
      tenantCode: 'PLATFORM',
      approvalId: '100',
      items: [
        { fileName: 'b.pdf', contentType: 'application/pdf', fileSize: 321 },
      ],
    });

    expect(presigned.items).toHaveLength(1);
    expect(presigned.items[0].uploadToken).toBe('token-2');
    expect(presigned.items[0].fileName).toBe('b.pdf');
  });
});
