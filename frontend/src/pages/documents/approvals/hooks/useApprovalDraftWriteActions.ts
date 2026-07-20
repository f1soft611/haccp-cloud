import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JSONContent } from '@tiptap/core';
import {
  saveHaccpWorkTempDraft,
  submitHaccpWorkDraft,
  updateHaccpWorkApprovalStatus,
} from '../../../../services/documents/haccpBaseWorkService';
import { extractApiErrorMessage } from '../../../../services/api/errorMessage';
import { useFeedback } from '../../../../shared/hooks/useFeedback';
import type { DocumentFieldValues } from '../../../../editor/utils/documentFieldValues';
import {
  resolveDocumentFieldSnapshotContent,
  resolveDocumentFieldSnapshotHtml,
} from '../../../../editor/utils/documentFieldSnapshot';

type UseApprovalDraftWriteActionsParams = {
  baseId?: string;
  idType: 'work' | 'approval';
  tenantCode: string;
  workId?: string;
  isStatusResolved?: boolean;
  approvalStatusType?: string;
  title: string;
  referenceIds: string[];
  editorContent: JSONContent;
  editorHtml: string;
  documentFieldValues: DocumentFieldValues;
  isOwner: boolean;
};

type UseApprovalDraftWriteActionsResult = {
  isSubmitting: boolean;
  errorMessage: string;
  clearErrorMessage: () => void;
  cancelSubmitDisabled: boolean;
  tempSaveDisabled: boolean;
  submitDisabled: boolean;
  handleCancelSubmit: () => void;
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
    isStatusResolved = true,
    approvalStatusType,
    title,
    referenceIds,
    editorContent,
    editorHtml,
    documentFieldValues,
    isOwner,
  } = params;

  // Note: ownership check is based on work.owner (actual draft author),
  // not work.createdBy (template creator)

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const [errorMessage, setErrorMessage] = useState('');

  const tempSaveMutation = useMutation({
    mutationFn: async () => {
      const targetId = (
        idType === 'approval' ? (workId ?? baseId) : (baseId ?? workId)
      )?.trim();
      if (!targetId) {
        throw new Error('저장 대상 ID를 찾을 수 없습니다.');
      }

      const snapshotContent = resolveDocumentFieldSnapshotContent(
        editorContent,
        documentFieldValues,
      );
      const snapshotHtml = resolveDocumentFieldSnapshotHtml(
        editorHtml,
        documentFieldValues,
      );

      return saveHaccpWorkTempDraft({
        tenantCode,
        id: targetId,
        title,
        templateJson: JSON.stringify(snapshotContent),
        templateHtml: snapshotHtml,
        referenceIds,
      });
    },
    onSuccess: async () => {
      setErrorMessage('');
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
      const message = extractApiErrorMessage(
        error,
        '임시저장 처리 중 오류가 발생했습니다.',
      );
      setErrorMessage(message);
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

      const snapshotContent = resolveDocumentFieldSnapshotContent(
        editorContent,
        documentFieldValues,
      );
      const snapshotHtml = resolveDocumentFieldSnapshotHtml(
        editorHtml,
        documentFieldValues,
      );

      return submitHaccpWorkDraft({
        tenantCode,
        id: targetId,
        title: normalizedTitle,
        templateJson: JSON.stringify(snapshotContent),
        templateHtml: snapshotHtml,
        referenceIds,
      });
    },
    onSuccess: async (result) => {
      setErrorMessage('');
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
      const message = extractApiErrorMessage(
        error,
        '결재신청 처리 중 오류가 발생했습니다.',
      );
      setErrorMessage(message);
      showError(message);
    },
  });

  const cancelSubmitMutation = useMutation({
    mutationFn: async () => {
      const approvalId = idType === 'approval' ? (baseId ?? '').trim() : '';
      if (!approvalId) {
        throw new Error('결재취소 대상 결재 ID를 찾을 수 없습니다.');
      }

      return updateHaccpWorkApprovalStatus({
        tenantCode,
        approvalId,
        eventType: 'submit_cancel',
      });
    },
    onSuccess: async () => {
      setErrorMessage('');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['dashboard-todos', tenantCode],
        }),
        queryClient.invalidateQueries({
          queryKey: ['haccp-work-draft-template', tenantCode, baseId, idType],
        }),
      ]);
      showSuccess(
        '결재 신청이 취소되었습니다. 임시저장/결재신청을 다시 할 수 있습니다.',
      );
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(
        error,
        '결재취소 처리 중 오류가 발생했습니다.',
      );
      setErrorMessage(message);
      showError(message);
    },
  });

  const isSubmitting =
    tempSaveMutation.isPending ||
    submitMutation.isPending ||
    cancelSubmitMutation.isPending;
  const normalizedApprovalStatus = String(approvalStatusType ?? '')
    .trim()
    .toLowerCase();
  const isPostSubmitLocked =
    normalizedApprovalStatus === 'in_progress' ||
    normalizedApprovalStatus === 'approved';
  const isStatusPending = Boolean(baseId) && !isStatusResolved;
  const tempSaveDisabled =
    !isOwner || !baseId || isStatusPending || isPostSubmitLocked;
  const submitDisabled =
    !isOwner ||
    !title.trim() ||
    !baseId ||
    isStatusPending ||
    isPostSubmitLocked;
  const cancelSubmitDisabled =
    !isOwner ||
    idType !== 'approval' ||
    isStatusPending ||
    normalizedApprovalStatus !== 'in_progress' ||
    !baseId;

  const handleCancelSubmit = () => {
    if (isSubmitting || cancelSubmitDisabled) {
      return;
    }
    cancelSubmitMutation.mutate();
  };

  const handleTempSave = () => {
    if (isSubmitting) {
      return;
    }
    if (isPostSubmitLocked) {
      const message = '결재 취소 후에 임시저장할 수 있습니다.';
      setErrorMessage(message);
      showError(message);
      return;
    }
    setErrorMessage('');
    tempSaveMutation.mutate();
  };

  const handleSubmitApproval = () => {
    if (isSubmitting) {
      return;
    }

    if (!title.trim()) {
      const message = '기안 제목은 필수입니다.';
      setErrorMessage(message);
      showError(message);
      return;
    }

    if (isPostSubmitLocked) {
      const message = '결재 취소 후에 결재신청할 수 있습니다.';
      setErrorMessage(message);
      showError(message);
      return;
    }

    setErrorMessage('');
    submitMutation.mutate();
  };

  return {
    isSubmitting,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(''),
    cancelSubmitDisabled,
    tempSaveDisabled,
    submitDisabled,
    handleCancelSubmit,
    handleTempSave,
    handleSubmitApproval,
  };
}
