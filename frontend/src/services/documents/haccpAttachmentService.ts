import { apiClient } from '../api/apiClient';

export type HaccpAttachmentItem = {
  attachmentId?: number;
  uploadToken?: string;
  objectKey?: string;
  uploadUrl?: string;
  requiredHeaders?: Record<string, string>;
  downloadUrl?: string;
  previewUrl?: string;
  fileName?: string;
  originalFileName?: string;
  contentType?: string;
  fileSize?: number;
  uploadStatus?: string;
  previewableYn?: 'Y' | 'N';
};

export type HaccpAttachmentPresignRequest = {
  tenantCode: string;
  approvalId: string | number;
  items: Array<{
    fileName: string;
    contentType: string;
    fileSize: number;
  }>;
};

export type HaccpAttachmentCompleteRequest = {
  uploadToken: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  checksumSha256?: string;
};

export type HaccpAttachmentPresignResult = {
  items: HaccpAttachmentItem[];
};

export type HaccpAttachmentListResult = {
  items: HaccpAttachmentItem[];
};

type AttachmentEnvelope = {
  items?: HaccpAttachmentItem[];
  result?: {
    resultList?: HaccpAttachmentItem[];
    items?: HaccpAttachmentItem[];
    downloadUrl?: string;
    previewUrl?: string;
  };
  downloadUrl?: string;
  previewUrl?: string;
};

function normalizeAttachmentItems(data: unknown): HaccpAttachmentItem[] {
  const payload = data as AttachmentEnvelope | null;

  const directItems = Array.isArray(payload?.items) ? payload.items : [];
  const wrappedItems = Array.isArray(payload?.result?.resultList)
    ? payload.result.resultList
    : [];
  const wrappedPlainItems = Array.isArray(payload?.result?.items)
    ? payload.result.items
    : [];

  return [...directItems, ...wrappedItems, ...wrappedPlainItems].map(
    (item) => ({
      ...item,
      fileName: item.fileName ?? item.originalFileName,
    }),
  );
}

export async function presignHaccpAttachmentsUpload(
  payload: HaccpAttachmentPresignRequest,
): Promise<HaccpAttachmentPresignResult> {
  const { data } = await apiClient.post<unknown>(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments/presign-upload`,
    { items: payload.items },
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );

  return {
    items: normalizeAttachmentItems(data),
  };
}

export async function completeHaccpAttachmentsUpload(payload: {
  tenantCode: string;
  approvalId: string | number;
  items: HaccpAttachmentCompleteRequest[];
}): Promise<HaccpAttachmentListResult> {
  const { data } = await apiClient.post<unknown>(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments/complete`,
    { items: payload.items },
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );

  return {
    items: normalizeAttachmentItems(data),
  };
}

export async function listHaccpAttachments(payload: {
  tenantCode: string;
  approvalId: string | number;
}): Promise<HaccpAttachmentListResult> {
  const { data } = await apiClient.get<unknown>(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments`,
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );

  return {
    items: normalizeAttachmentItems(data),
  };
}

export async function presignHaccpAttachmentDownload(payload: {
  tenantCode: string;
  approvalId: string | number;
  attachmentId: string | number;
}): Promise<{ downloadUrl: string }> {
  const { data } = await apiClient.post<AttachmentEnvelope>(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments/${payload.attachmentId}/presign-download`,
    {},
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );

  const downloadUrl = data?.downloadUrl ?? data?.result?.downloadUrl;
  if (!downloadUrl) {
    throw new Error('다운로드 URL을 찾지 못했습니다.');
  }

  return { downloadUrl };
}

export async function presignHaccpAttachmentPreview(payload: {
  tenantCode: string;
  approvalId: string | number;
  attachmentId: string | number;
}): Promise<{ previewUrl: string }> {
  const { data } = await apiClient.post<AttachmentEnvelope>(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments/${payload.attachmentId}/presign-preview`,
    {},
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );

  const previewUrl = data?.previewUrl ?? data?.result?.previewUrl;
  if (!previewUrl) {
    throw new Error('미리보기 URL을 찾지 못했습니다.');
  }

  return { previewUrl };
}

export async function deleteHaccpAttachment(payload: {
  tenantCode: string;
  approvalId: string | number;
  attachmentId: string | number;
}): Promise<void> {
  await apiClient.delete(
    `/v1/haccp-work/approvals/${payload.approvalId}/attachments/${payload.attachmentId}`,
    {
      headers: {
        'x-tenant-code': payload.tenantCode,
      },
    },
  );
}
