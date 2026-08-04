import { Alert, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { ApprovalDraftContent } from './components/ApprovalDraftContent';
import { ApprovalDraftHeader } from './components/ApprovalDraftHeader';
import { useApprovalDraftComments } from './hooks/useApprovalDraftComments';
import { useApprovalDraftWriteActions } from './hooks/useApprovalDraftWriteActions';
import { useApprovalDraftWriteData } from './hooks/useApprovalDraftWriteData';

export function ApprovalDraftWritePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const isDarkMode = theme.palette.mode === 'dark';

  const {
    baseId,
    idType,
    tenantCode,
    displayName,
    userId,
    title,
    drafterDisplayName,
    setTitle,
    referenceIds,
    setReferenceIds,
    workDetailQuery,
    work,
    documentFieldValues,
    resolvedEditorContent,
    resolvedEditorHtml,
    handleChangeEditor,
    referenceOptions,
    selectedReferences,
    drafterProfile,
    reviewerProfile,
    approverProfile,
    isOwner,
    isReadOnly,
    canTempSave,
    canSubmit,
    canSubmitCancel,
    canApprove,
    canConfirm,
    canReject,
    isFinalOwnerConfirm,
    approvalEventType,
    referenceEventType,
    rejectEventType,
    submitLabel,
  } = useApprovalDraftWriteData();

  const isStatusResolved = !baseId || workDetailQuery.isFetched;
  const returnTo = (searchParams.get('returnTo') || '').trim();
  const approvalIdForComments =
    idType === 'approval'
      ? (baseId ?? '').trim()
      : (work?.approvalId ?? '').trim();

  const {
    comments,
    replyDraftByCommentId,
    setReplyDraft,
    addComment,
    addReply,
    editComment,
    deleteComment,
    refreshComments,
    commentLoadErrorMessage,
  } = useApprovalDraftComments(
    tenantCode,
    approvalIdForComments,
    displayName || userId,
    drafterProfile?.profileImage,
  );

  const {
    isSubmitting,
    errorMessage,
    clearErrorMessage,
    approveDisabled,
    rejectDisabled,
    tempSaveDisabled,
    submitDisabled,
    cancelSubmitDisabled,
    confirmDisabled,
    handleApprove,
    handleConfirm,
    handleReject,
    handleCancelSubmit,
    handleTempSave,
    handleSubmitApproval,
  } = useApprovalDraftWriteActions({
    baseId,
    idType,
    tenantCode,
    workId: work?.id,
    isStatusResolved,
    approvalStatusType: work?.approvalStatusType,
    title,
    referenceIds,
    documentFieldValues,
    editorContent: resolvedEditorContent,
    editorHtml: resolvedEditorHtml,
    canTempSave,
    canSubmit,
    canSubmitCancel,
    canApprove,
    canConfirm,
    canReject,
    isFinalOwnerConfirm,
    approvalEventType,
    referenceEventType,
    rejectEventType,
  });

  const showApprove = canApprove && idType === 'approval';
  const showConfirm = canConfirm && idType === 'approval';
  const showReject = canReject && idType === 'approval';
  const showCancelSubmit =
    canSubmitCancel && idType === 'approval' && !canApprove;
  const showTempSave = canTempSave;
  const showSubmit = canSubmit;
  const normalizedApprovalStatus = String(work?.approvalStatusType ?? '')
    .trim()
    .toLowerCase();
  const canUploadAttachmentsWhileInProgress =
    isOwner && normalizedApprovalStatus === 'in_progress';
  const attachmentReadOnly = isReadOnly && !canUploadAttachmentsWhileInProgress;
  const approveLabel = showConfirm
    ? isFinalOwnerConfirm
      ? '최종 확인'
      : '확인'
    : approvalEventType === 'final_approve'
      ? '최종 승인'
      : '검토 승인';

  return (
    <Stack spacing={2.25}>
      <ApprovalDraftHeader
        onBack={() => {
          if (returnTo) {
            navigate(returnTo);
            return;
          }
          navigate('/dashboard');
        }}
        onTempSave={showTempSave ? handleTempSave : undefined}
        onApprove={
          showConfirm
            ? () => setApproveConfirmOpen(true)
            : showApprove
              ? () => setApproveConfirmOpen(true)
              : undefined
        }
        approveLabel={approveLabel}
        onReject={showReject ? () => setRejectConfirmOpen(true) : undefined}
        onCancelSubmit={
          !showCancelSubmit
            ? undefined
            : () => {
                if (isSubmitting) {
                  return;
                }
                setCancelConfirmOpen(true);
              }
        }
        onSubmitApproval={
          !showSubmit
            ? undefined
            : () => {
                if (submitDisabled || isSubmitting) {
                  return;
                }
                setSubmitConfirmOpen(true);
              }
        }
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
        approveDisabled={showConfirm ? confirmDisabled : approveDisabled}
        rejectDisabled={rejectDisabled}
        tempSaveDisabled={tempSaveDisabled}
        submitDisabled={submitDisabled}
        cancelSubmitDisabled={cancelSubmitDisabled}
      />

      {errorMessage ? (
        <Alert severity="error" onClose={clearErrorMessage}>
          {errorMessage}
        </Alert>
      ) : null}

      {isReadOnly ? (
        <Alert severity="info">
          {isOwner
            ? canUploadAttachmentsWhileInProgress
              ? '결재 진행중 문서는 본문 편집은 잠겨 있지만 첨부파일 업로드는 가능합니다.'
              : '문서 상태상 현재는 읽기 전용입니다.'
            : '이 문서의 소유자가 아니므로 편집할 수 없습니다.'}
        </Alert>
      ) : null}

      <ApprovalDraftContent
        baseId={baseId}
        idType={idType}
        isDarkMode={isDarkMode}
        workDetailError={workDetailQuery.isError}
        workDetailFetched={workDetailQuery.isFetched}
        work={work}
        title={title}
        onTitleChange={isReadOnly ? undefined : setTitle}
        drafterDisplayName={drafterDisplayName}
        userId={userId}
        content={resolvedEditorContent}
        onChangeEditor={isReadOnly ? undefined : handleChangeEditor}
        documentFieldValues={documentFieldValues}
        drafterProfile={drafterProfile}
        reviewerProfile={reviewerProfile}
        approverProfile={approverProfile}
        referenceOptions={referenceOptions}
        selectedReferences={selectedReferences}
        onChangeReferences={isReadOnly ? undefined : setReferenceIds}
        comments={comments}
        replyDraftByCommentId={replyDraftByCommentId}
        onChangeReplyDraft={setReplyDraft}
        onAddComment={addComment}
        onAddReply={addReply}
        onEditComment={editComment}
        onDeleteComment={deleteComment}
        currentUserLoginCode={userId}
        tenantCode={tenantCode}
        approvalId={approvalIdForComments}
        canWriteComments={true}
        commentLoadErrorMessage={commentLoadErrorMessage}
        onAttachmentChanged={refreshComments}
        isReadOnly={isReadOnly}
        attachmentReadOnly={attachmentReadOnly}
      />

      <ConfirmDialog
        open={submitConfirmOpen}
        title={`${submitLabel} 확인`}
        description={`작성한 내용을 ${submitLabel}하시겠습니까?`}
        confirmText={submitLabel}
        confirmColor="primary"
        loading={isSubmitting}
        onConfirm={() => {
          setSubmitConfirmOpen(false);
          handleSubmitApproval();
        }}
        onClose={() => setSubmitConfirmOpen(false)}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="결재 취소 확인"
        description="현재 결재 진행을 취소하시겠습니까?"
        confirmText="결재 취소"
        confirmColor="error"
        loading={isSubmitting}
        onConfirm={() => {
          setCancelConfirmOpen(false);
          handleCancelSubmit();
        }}
        onClose={() => setCancelConfirmOpen(false)}
      />

      <ConfirmDialog
        open={approveConfirmOpen}
        title={showConfirm ? approveLabel : `${approveLabel} 확인`}
        description={
          showConfirm
            ? isFinalOwnerConfirm
              ? '문서를 최종 확인 처리하시겠습니까?'
              : '문서를 확인 처리하시겠습니까?'
            : `${approveLabel}를 진행하시겠습니까?`
        }
        confirmText={approveLabel}
        confirmColor="primary"
        loading={isSubmitting}
        onConfirm={() => {
          setApproveConfirmOpen(false);
          if (showConfirm) {
            handleConfirm();
            return;
          }
          handleApprove();
        }}
        onClose={() => setApproveConfirmOpen(false)}
      />

      <ConfirmDialog
        open={rejectConfirmOpen}
        title="반려 확인"
        description="현재 문서를 반려하시겠습니까?"
        confirmText="반려"
        confirmColor="error"
        loading={isSubmitting}
        onConfirm={() => {
          setRejectConfirmOpen(false);
          handleReject();
        }}
        onClose={() => setRejectConfirmOpen(false)}
      />
    </Stack>
  );
}
