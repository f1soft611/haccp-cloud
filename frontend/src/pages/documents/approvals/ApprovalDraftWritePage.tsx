import { Alert, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { ApprovalDraftContent } from './components/ApprovalDraftContent';
import { ApprovalDraftHeader } from './components/ApprovalDraftHeader';
import { useApprovalDraftComments } from './hooks/useApprovalDraftComments';
import { useApprovalDraftWriteActions } from './hooks/useApprovalDraftWriteActions';
import { useApprovalDraftWriteData } from './hooks/useApprovalDraftWriteData';

export function ApprovalDraftWritePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
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
  } = useApprovalDraftWriteData();
  const isStatusResolved = !baseId || workDetailQuery.isFetched;

  const {
    comments,
    replyDraftByCommentId,
    setReplyDraft,
    addComment,
    addReply,
  } = useApprovalDraftComments(
    displayName || userId,
    drafterProfile?.profileImage,
  );

  const {
    isSubmitting,
    errorMessage,
    clearErrorMessage,
    tempSaveDisabled,
    submitDisabled,
    cancelSubmitDisabled,
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
    isOwner,
  });

  return (
    <Stack spacing={2.25}>
      <ApprovalDraftHeader
        onBack={() => navigate('/dashboard')}
        onTempSave={handleTempSave}
        onCancelSubmit={
          cancelSubmitDisabled
            ? undefined
            : () => {
                if (isSubmitting) {
                  return;
                }
                setCancelConfirmOpen(true);
              }
        }
        onSubmitApproval={() => {
          if (submitDisabled || isSubmitting) {
            return;
          }
          setSubmitConfirmOpen(true);
        }}
        isSubmitting={isSubmitting}
        tempSaveDisabled={tempSaveDisabled}
        submitDisabled={submitDisabled}
        cancelSubmitDisabled={cancelSubmitDisabled}
      />

      {errorMessage ? (
        <Alert severity="error" onClose={clearErrorMessage}>
          {errorMessage}
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
        isReadOnly={isReadOnly}
      />

      <ConfirmDialog
        open={submitConfirmOpen}
        title="결재 신청 확인"
        description="작성한 내용을 결재 신청하시겠습니까?"
        confirmText="결재 신청"
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
    </Stack>
  );
}
