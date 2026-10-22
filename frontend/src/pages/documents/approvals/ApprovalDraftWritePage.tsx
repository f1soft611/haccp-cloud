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
import { canDeleteDraft } from './utils/approvalDraftUtils';

export function ApprovalDraftWritePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
    reportDate,
    changeReportDate,
    sub,
    setSub,
    users,
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
  const approvalApply = work?.approvalApply !== false;
  const resolvedSubmitLabel = approvalApply ? submitLabel : '저장';
  const returnTo = (searchParams.get('returnTo') || '').trim();
  const approvalIdForComments =
    idType === 'approval'
      ? (baseId ?? '').trim()
      : (work?.approvalId ?? '').trim();

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    navigate('/dashboard');
  };

  const {
    comments,
    replyDraftByCommentId,
    setReplyDraft,
    addComment,
    addReply,
    editComment,
    deleteComment,
    toggleLikeComment,
    refreshComments,
    commentLoadErrorMessage,
  } = useApprovalDraftComments(
    tenantCode,
    approvalIdForComments,
    displayName || userId,
    drafterProfile?.profileImage,
    userId,
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
    confirmDisabled,deleteDisabled,
    handleApprove,
    handleConfirm,
    handleReject,
    handleCancelSubmit,
    handleTempSave,
    handleSubmitApproval,handleDelete,
  } = useApprovalDraftWriteActions({
    baseId,
    idType,
    tenantCode,
    workId: work?.id,
    approvalId: approvalIdForComments,
    onDeleted: handleBack,
    cycleDate: work?.cycleDate,
    reportDate,
    returnTo,
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
    approvalApply,
  });

  const showApprove = canApprove && idType === 'approval';
  const showConfirm = canConfirm && idType === 'approval';
  const showReject = canReject && idType === 'approval';
  const showCancelSubmit =
    canSubmitCancel && idType === 'approval' && !canApprove;
  // 변경 -> 결재 미적용 문서는 임시저장 없이 저장(완료) 버튼 하나만 노출
  const showTempSave = canTempSave && approvalApply;
  const showSubmit = canSubmit;

  const showDelete = canDeleteDraft({
    isOwner,
    approvalStatusType: work?.approvalStatusType,
    draftNumber: work?.draftNumber,
    approvalId: approvalIdForComments,
  });

  const normalizedApprovalStatus = String(work?.approvalStatusType ?? '')
    .trim()
    .toLowerCase();
  const canUploadAttachmentsWhileInProgress = isOwner && normalizedApprovalStatus === 'in_progress';
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
          onBack={handleBack}
          onDelete={showDelete ? () => setDeleteConfirmOpen(true) : undefined}
          deleteDisabled={deleteDisabled}
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
          submitLabel={resolvedSubmitLabel}
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
        reportDate={reportDate}
        onReportDateChange={isReadOnly ? undefined : changeReportDate}
        sub={sub}
        onSubChange={isReadOnly ? undefined : setSub}
        users={users}
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
        onToggleLikeComment={toggleLikeComment}
        currentUserLoginCode={userId}
        tenantCode={tenantCode}
        approvalId={approvalIdForComments}
        canWriteComments={true}
        commentLoadErrorMessage={commentLoadErrorMessage}
        onAttachmentChanged={refreshComments}
        isReadOnly={isReadOnly}
        attachmentReadOnly={attachmentReadOnly}
        showApprovalLine={approvalApply}
      />

      <ConfirmDialog
        open={submitConfirmOpen}
        title={`${resolvedSubmitLabel} 확인`}
        description={
          approvalApply
              ? `작성한 내용을 ${submitLabel}하시겠습니까?`
              : '작성한 내용을 저장하시겠습니까? 저장 후에는 수정할 수 없습니다.'
        }
        confirmText={resolvedSubmitLabel}
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

      <ConfirmDialog
          open={deleteConfirmOpen}
          title="기안 삭제 확인"
          description="임시저장된 기안을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
          confirmText="삭제"
          confirmColor="error"
          loading={isSubmitting}
          onConfirm={() => {
            setDeleteConfirmOpen(false);
            handleDelete();
          }}
          onClose={() => setDeleteConfirmOpen(false)}
      />
    </Stack>
  );
}
