import {
  completeHaccpAttachmentsUpload,
  copyHaccpAttachmentsFromApproval,
  presignHaccpAttachmentsUpload,
  type HaccpAttachmentCompleteRequest,
} from '../../../../services/documents/haccpAttachmentService';
import { extractApiErrorMessage } from '../../../../services/api/errorMessage';

export type ApprovalAttachmentUploadResult = {
  succeeded: number;
  failed: number;
  errorMessage?: string;
};

const extractStorageErrorMessage = (rawText: string) => {
  const messageMatch = rawText.match(/<Message>([^<]+)<\/Message>/i);
  if (messageMatch?.[1]) {
    return messageMatch[1].trim();
  }

  const codeMatch = rawText.match(/<Code>([^<]+)<\/Code>/i);
  if (codeMatch?.[1]) {
    return codeMatch[1].trim();
  }

  return rawText.trim();
};

const resolveStorageUploadErrorMessage = async (response: Response) => {
  const responseText = await response.text().catch(() => '');

  const parsedMessage = responseText
    ? extractStorageErrorMessage(responseText)
    : '';

  if (parsedMessage) {
    return `파일 업로드 저장소 전송에 실패했습니다. (${response.status}) ${parsedMessage}`;
  }

  return `파일 업로드 저장소 전송에 실패했습니다. (${response.status})`;
};

const resolveUploadErrorMessage = (error: unknown) => {
  const networkLikelyIssue =
    error instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(error.message);

  return networkLikelyIssue
    ? '스토리지 업로드 연결에 실패했습니다. MinIO(218.155.74.34:9000) 실행/CORS 설정을 확인해주세요.'
    : extractApiErrorMessage(error, '첨부파일 업로드에 실패했습니다.');
};

export async function uploadApprovalAttachments(params: {
  tenantCode: string;
  approvalId: string;
  files: File[];
}): Promise<ApprovalAttachmentUploadResult> {
  const { tenantCode, approvalId, files } = params;
  if (!files.length) {
    return { succeeded: 0, failed: 0 };
  }

  try {
    const presigned = await presignHaccpAttachmentsUpload({
      tenantCode,
      approvalId,
      items: files.map((file) => ({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      })),
    });

    const settled = await Promise.allSettled(
      presigned.items.map(async (item, index) => {
        const file = files[index];
        if (!file) {
          return null;
        }

        if (item.uploadUrl) {
          const uploadHeaders: Record<string, string> = {
            ...(item.requiredHeaders ?? {}),
          };
          if (!uploadHeaders['Content-Type']) {
            uploadHeaders['Content-Type'] =
              file.type || 'application/octet-stream';
          }

          const uploadResponse = await fetch(item.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: uploadHeaders,
          });
          if (!uploadResponse.ok) {
            throw new Error(
              await resolveStorageUploadErrorMessage(uploadResponse),
            );
          }
        }

        return {
          uploadToken: item.uploadToken ?? '',
          objectKey: item.objectKey ?? '',
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
        };
      }),
    );

    const completePayload: HaccpAttachmentCompleteRequest[] = [];
    let firstError: unknown;
    settled.forEach((entry) => {
      if (entry.status === 'fulfilled' && entry.value) {
        completePayload.push(entry.value);
      } else if (entry.status === 'rejected' && firstError === undefined) {
        firstError = entry.reason;
      }
    });

    if (completePayload.length) {
      await completeHaccpAttachmentsUpload({
        tenantCode,
        approvalId,
        items: completePayload,
      });
    }

    return {
      succeeded: completePayload.length,
      failed: files.length - completePayload.length,
      errorMessage:
        firstError === undefined
          ? undefined
          : resolveUploadErrorMessage(firstError),
    };
  } catch (error) {
    return {
      succeeded: 0,
      failed: files.length,
      errorMessage: resolveUploadErrorMessage(error),
    };
  }
}

export async function syncApprovalAttachmentsAfterSave(params: {
  tenantCode: string;
  savedApprovalId?: string | number | null;
  sourceApprovalId?: string;
  files: File[];
}): Promise<{ warningMessage?: string }> {
  const targetId = String(params.savedApprovalId ?? '').trim();
  const sourceId = (params.sourceApprovalId ?? '').trim();
  const needsCopy = Boolean(sourceId) && sourceId !== targetId;

  if (!params.files.length && !needsCopy) {
    return {};
  }

  if (!targetId) {
    return {
      warningMessage:
        '문서는 저장되었지만 첨부파일을 처리하지 못했습니다. 문서 화면에서 다시 첨부해주세요.',
    };
  }

  const problems: string[] = [];
  if (needsCopy) {
    try {
      await copyHaccpAttachmentsFromApproval({
        tenantCode: params.tenantCode,
        approvalId: targetId,
        sourceApprovalId: sourceId,
      });
    } catch {
      problems.push('반려 문서의 첨부파일을 가져오지 못했습니다.');
    }
  }

  if (params.files.length) {
    const { failed } = await uploadApprovalAttachments({
      tenantCode: params.tenantCode,
      approvalId: targetId,
      files: params.files,
    });
    if (failed) {
      problems.push(`첨부파일 ${failed}건 업로드에 실패했습니다.`);
    }
  }

  return problems.length
    ? {
        warningMessage: `문서는 저장되었지만 ${problems.join(' ')} 문서 화면에서 다시 첨부해주세요.`,
      }
    : {};
}
