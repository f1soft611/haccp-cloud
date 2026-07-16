import { Alert } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';
import type { DocumentFieldValues } from '../../../../editor/utils/documentFieldValues';
import { ApprovalDraftCommentThread } from './ApprovalDraftCommentThread';
import { ApprovalDraftEditorSection } from './ApprovalDraftEditorSection';
import { ApprovalDraftSidebar } from './ApprovalDraftSidebar';
import type { DraftComment } from '../types';

type ApprovalDraftContentProps = {
  baseId?: string;
  isDarkMode: boolean;
  workDetailError: boolean;
  workDetailFetched: boolean;
  work?: HaccpBaseWorkItem;
  title: string;
  onTitleChange: (next: string) => void;
  displayName: string;
  userId: string;
  content: JSONContent;
  onChangeEditor: (nextContent: JSONContent, nextHtml: string) => void;
  documentFieldValues: DocumentFieldValues;
  drafterProfile?: UserItem;
  reviewerProfile?: UserItem;
  approverProfile?: UserItem;
  referenceOptions: UserItem[];
  selectedReferences: UserItem[];
  onChangeReferences: (next: string[]) => void;
  comments: DraftComment[];
  replyDraftByCommentId: Record<string, string>;
  onChangeReplyDraft: (commentId: string, value: string) => void;
  onAddComment: (value: string) => void;
  onAddReply: (commentId: string) => void;
};

export function ApprovalDraftContent(props: ApprovalDraftContentProps) {
  const {
    baseId,
    isDarkMode,
    workDetailError,
    workDetailFetched,
    work,
    title,
    onTitleChange,
    displayName,
    userId,
    content,
    onChangeEditor,
    documentFieldValues,
    drafterProfile,
    reviewerProfile,
    approverProfile,
    referenceOptions,
    selectedReferences,
    onChangeReferences,
    comments,
    replyDraftByCommentId,
    onChangeReplyDraft,
    onAddComment,
    onAddReply,
  } = props;

  return (
    <>
      {workDetailFetched && workDetailError ? (
        <Alert severity="warning">대상 템플릿을 찾을 수 없습니다.</Alert>
      ) : null}

      <ApprovalDraftEditorSection
        baseId={baseId}
        work={work}
        title={title}
        onTitleChange={onTitleChange}
        displayName={displayName}
        userId={userId}
        metadataSection={
          <ApprovalDraftSidebar
            embedded
            isDarkMode={isDarkMode}
            work={work}
            drafterName={displayName || userId}
            drafterProfile={drafterProfile}
            reviewerProfile={reviewerProfile}
            approverProfile={approverProfile}
            referenceOptions={referenceOptions}
            selectedReferences={selectedReferences}
            onChangeReferences={onChangeReferences}
          />
        }
        content={content}
        onChangeEditor={onChangeEditor}
        documentFieldValues={documentFieldValues}
      />

      <ApprovalDraftCommentThread
        comments={comments}
        onAddComment={onAddComment}
        replyDraftByCommentId={replyDraftByCommentId}
        onChangeReplyDraft={onChangeReplyDraft}
        onAddReply={onAddReply}
      />
    </>
  );
}
