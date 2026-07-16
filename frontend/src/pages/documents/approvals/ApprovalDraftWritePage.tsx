import { Stack } from '@mui/material';
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
  const isDarkMode = theme.palette.mode === 'dark';
  const {
    baseId,
    idType,
    tenantCode,
    displayName,
    userId,
    title,
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
  } = useApprovalDraftWriteData();

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

  const { isSubmitting, submitDisabled, handleTempSave, handleSubmitApproval } =
    useApprovalDraftWriteActions({
      baseId,
      idType,
      tenantCode,
      workId: work?.id,
      title,
      referenceIds,
      editorContent: resolvedEditorContent,
      editorHtml: resolvedEditorHtml,
    });

  return (
    <Stack spacing={2.25}>
      <ApprovalDraftHeader
        onBack={() => navigate('/dashboard')}
        onTempSave={handleTempSave}
        onSubmitApproval={() => {
          if (submitDisabled || isSubmitting) {
            return;
          }
          setSubmitConfirmOpen(true);
        }}
        isSubmitting={isSubmitting}
        submitDisabled={submitDisabled}
      />

      <ApprovalDraftContent
        baseId={baseId}
        isDarkMode={isDarkMode}
        workDetailError={workDetailQuery.isError}
        workDetailFetched={workDetailQuery.isFetched}
        work={work}
        title={title}
        onTitleChange={setTitle}
        displayName={displayName}
        userId={userId}
        content={resolvedEditorContent}
        onChangeEditor={handleChangeEditor}
        documentFieldValues={documentFieldValues}
        drafterProfile={drafterProfile}
        reviewerProfile={reviewerProfile}
        approverProfile={approverProfile}
        referenceOptions={referenceOptions}
        selectedReferences={selectedReferences}
        onChangeReferences={setReferenceIds}
        comments={comments}
        replyDraftByCommentId={replyDraftByCommentId}
        onChangeReplyDraft={setReplyDraft}
        onAddComment={addComment}
        onAddReply={addReply}
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
    </Stack>
  );
}
