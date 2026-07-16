import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { JSONContent } from '@tiptap/core';
import {
  saveHaccpWorkTempDraft,
  submitHaccpWorkDraft,
} from '../../../../services/documents/haccpBaseWorkService';
import { useFeedback } from '../../../../shared/hooks/useFeedback';

type UseApprovalDraftWriteActionsParams = {
  baseId?: string;
  idType: 'work' | 'approval';
  tenantCode: string;
  workId?: string;
  title: string;
  referenceIds: string[];
  editorContent: JSONContent;
  editorHtml: string;
};

type UseApprovalDraftWriteActionsResult = {
  isSubmitting: boolean;
  submitDisabled: boolean;
  handleTempSave: () => void;
  handleSubmitApproval: () => void;
};

export function useApprovalDraftWriteActions(
  params: UseApprovalDraftWriteActionsParams,
): UseApprovalDraftWriteActionsResult {
  const {
    baseId,
    idType,
    tenantCode,
    workId,
    title,
    referenceIds,
    editorContent,
    editorHtml,
  } = params;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();

  const tempSaveMutation = useMutation({
    mutationFn: async () => {
      const targetId = (
        idType === 'approval' ? (workId ?? baseId) : (baseId ?? workId)
      )?.trim();
      if (!targetId) {
        throw new Error('저장 대상 ID를 찾을 수 없습니다.');
      }

      return saveHaccpWorkTempDraft({
        tenantCode,
        id: targetId,
        title,
        templateJson: JSON.stringify(editorContent),
        templateHtml: editorHtml,
        referenceIds,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['haccp-work-draft-template', tenantCode, baseId, idType],
        }),
        queryClient.invalidateQueries({
          queryKey: ['dashboard-todos', tenantCode],
        }),
      ]);
      showSuccess('임시저장이 완료되었습니다.');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : '임시저장 처리 중 오류가 발생했습니다.';
      showError(message);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const targetId = (
        idType === 'approval' ? (workId ?? baseId) : (baseId ?? workId)
      )?.trim();
      if (!targetId) {
        throw new Error('결재신청 대상 ID를 찾을 수 없습니다.');
      }

      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        throw new Error('기안 제목은 필수입니다.');
      }

      return submitHaccpWorkDraft({
        tenantCode,
        id: targetId,
        title: normalizedTitle,
        templateJson: JSON.stringify(editorContent),
        templateHtml: editorHtml,
        referenceIds,
      });
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['dashboard-todos', tenantCode],
        }),
        queryClient.invalidateQueries({
          queryKey: ['haccp-work-draft-template', tenantCode, baseId, idType],
        }),
      ]);

      showSuccess(result.message || '결재신청이 완료되었습니다.');
      if (result.approvalId) {
        navigate(`/approvals/draft/${result.approvalId}?idType=approval`, {
          replace: true,
        });
        return;
      }
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : '결재신청 처리 중 오류가 발생했습니다.';
      showError(message);
    },
  });

  const isSubmitting = tempSaveMutation.isPending || submitMutation.isPending;
  const submitDisabled = !title.trim() || !baseId;

  const handleTempSave = () => {
    if (isSubmitting) {
      return;
    }
    tempSaveMutation.mutate();
  };

  const handleSubmitApproval = () => {
    if (isSubmitting) {
      return;
    }

    if (!title.trim()) {
      showError('기안 제목은 필수입니다.');
      return;
    }

    submitMutation.mutate();
  };

  return {
    isSubmitting,
    submitDisabled,
    handleTempSave,
    handleSubmitApproval,
  };
}
