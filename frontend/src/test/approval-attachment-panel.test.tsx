import { render as rtlRender, screen, waitFor, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import type { ReactElement } from 'react';
import { appTheme } from '../app/theme';
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

// 패널이 theme.ts 의 palette 토큰을 읽으므로 앱 테마로 감싸서 렌더링한다
const render = (ui: ReactElement, options?: RenderOptions) =>
  rtlRender(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={appTheme}>{children}</ThemeProvider>
    ),
    ...options,
  });

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

  it('keeps files as pending when the document has no approval id', async () => {
    const onChangePendingFiles = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <ApprovalAttachmentPanel
        tenantCode="PLATFORM"
        approvalId=""
        pendingFiles={[]}
        onChangePendingFiles={onChangePendingFiles}
      />,
    );

    expect(
      screen.getByText('선택한 파일은 임시저장 또는 결재신청 시 함께 업로드됩니다.'),
    ).toBeInTheDocument();

    const file = new File(['hello'], 'pending.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('첨부파일 선택'), file);

    expect(onChangePendingFiles).toHaveBeenCalledWith([file]);

    rerender(
      <ApprovalAttachmentPanel
        tenantCode="PLATFORM"
        approvalId=""
        pendingFiles={[file]}
        onChangePendingFiles={onChangePendingFiles}
      />,
    );

    expect(screen.getByText('pending.pdf')).toBeInTheDocument();
    expect(screen.getByText('저장 시 업로드')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'remove pending attachment' }));
    expect(onChangePendingFiles).toHaveBeenLastCalledWith([]);
  });

  it('stays disabled without approval id when pending handler is absent', () => {
    render(<ApprovalAttachmentPanel tenantCode="PLATFORM" approvalId="" />);

    expect(
      screen.getByRole('button', { name: '문서 생성 후 업로드 가능' }),
    ).toBeDisabled();
  });
});
