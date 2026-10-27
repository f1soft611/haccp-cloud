import { Alert } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';
import type { DocumentFieldValues } from '../../../../editor/utils/documentFieldValues';
import { ApprovalDraftCommentThread } from './ApprovalDraftCommentThread';
import { ApprovalDraftEditorSection } from './ApprovalDraftEditorSection';
import { ApprovalDraftSidebar } from './ApprovalDraftSidebar';
import { ApprovalAttachmentPanel } from './ApprovalAttachmentPanel';
import type { DraftComment } from '../types';
import type { ApprovalSubValues } from '../../../../services/documents/haccpBaseWorkService';
import { getApprovalSubFieldConfig } from '../utils/approvalSubFields';
import { ApprovalDraftExpirationFields } from './ApprovalDraftExpirationFields';

type ApprovalDraftContentProps = {
  baseId?: string;
  idType: 'work' | 'approval';
  isDarkMode: boolean;
  workDetailError: boolean;
  workDetailFetched: boolean;
  work?: HaccpBaseWorkItem;
  title: string;
  onTitleChange?: (next: string) => void;
  reportDate: string;
  onReportDateChange?: (next: string) => void;
  sub: ApprovalSubValues;
  onSubChange?: (next: ApprovalSubValues) => void;
  users: UserItem[];
  drafterDisplayName: string;
  userId: string;
  content: JSONContent;
  onChangeEditor?: (nextContent: JSONContent, nextHtml: string) => void;
  documentFieldValues: DocumentFieldValues;
  drafterProfile?: UserItem;
  reviewerProfile?: UserItem;
  approverProfile?: UserItem;
  referenceOptions: UserItem[];
  selectedReferences: UserItem[];
  onChangeReferences?: (next: string[]) => void;
  comments: DraftComment[];
  replyDraftByCommentId: Record<string, string>;
  onChangeReplyDraft: (commentId: string, value: string) => void;
  onAddComment: (value: string) => void;
  onAddReply: (commentId: string) => void;
  onEditComment: (commentId: string, value: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLikeComment: (commentId: string) => void;
  currentUserLoginCode?: string;
  tenantCode?: string;
  approvalId?: string;
  isReadOnly?: boolean;
  attachmentReadOnly?: boolean;
  canWriteComments?: boolean;
  commentLoadErrorMessage?: string;
  onAttachmentChanged?: () => void | Promise<void>;
  showApprovalLine?: boolean;
};

export function ApprovalDraftContent(props: ApprovalDraftContentProps) {
  const {
    baseId,
    idType,
    isDarkMode,
    workDetailError,
    workDetailFetched,
    work,
    title,
    onTitleChange,
    reportDate,
    onReportDateChange,
    sub,
    onSubChange,
    users,
    drafterDisplayName,
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
    onEditComment,
    onDeleteComment,
    onToggleLikeComment,
    currentUserLoginCode,
    tenantCode = '',
    approvalId = '',
    isReadOnly = false,
    attachmentReadOnly = isReadOnly,
    canWriteComments = true,
    commentLoadErrorMessage = '',
    onAttachmentChanged,
    showApprovalLine = true,
  } = props;

  const subFieldConfig = getApprovalSubFieldConfig(work?.categoryCode);

  return (
    <>
      {workDetailFetched && workDetailError ? (
        <Alert severity="warning">대상 템플릿을 찾을 수 없습니다.</Alert>
      ) : null}

      <ApprovalDraftEditorSection
        baseId={baseId}
        idType={idType}
        work={work}
        title={title}
        onTitleChange={onTitleChange}
        // 기존 -> reportDate={reportDate} onReportDateChange={onReportDateChange}
        // 변경 -> 만료일 관리 업무는 검사일이 업무 기준일로 저장되므로 검사일을 보여 주고 직접 수정은 막는다
        reportDate={subFieldConfig ? sub.inspectedDate : reportDate}
        onReportDateChange={subFieldConfig ? undefined : onReportDateChange}
        subFieldsSection={
          subFieldConfig ? (
              <ApprovalDraftExpirationFields
                  tenantCode={tenantCode}
                  config={subFieldConfig}
                  value={sub}
                  onChange={onSubChange}
                  users={users}
                  isReadOnly={isReadOnly}
              />
          ) : undefined
        }
        drafterDisplayName={drafterDisplayName}
        userId={userId}
        metadataSection={
          showApprovalLine ? (
              <ApprovalDraftSidebar
                  embedded
                  isDarkMode={isDarkMode}
                  work={work}
                  drafterName={drafterDisplayName || userId}
                  drafterProfile={drafterProfile}
                  reviewerProfile={reviewerProfile}
                  approverProfile={approverProfile}
                  referenceOptions={referenceOptions}
                  selectedReferences={selectedReferences}
                  onChangeReferences={onChangeReferences}
                  isReadOnly={isReadOnly}
              />
          ) : undefined
        }
        content={content}
        onChangeEditor={onChangeEditor}
        documentFieldValues={documentFieldValues}
        isReadOnly={isReadOnly}
      />

      <ApprovalAttachmentPanel
        tenantCode={tenantCode}
        approvalId={approvalId}
        isReadOnly={attachmentReadOnly}
        onChanged={onAttachmentChanged}
      />

      <ApprovalDraftCommentThread
        comments={comments}
        replyDraftByCommentId={replyDraftByCommentId}
        onChangeReplyDraft={onChangeReplyDraft}
        onAddComment={onAddComment}
        onAddReply={onAddReply}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        onToggleLikeComment={onToggleLikeComment}
        currentUserLoginCode={currentUserLoginCode}
        canWriteComments={canWriteComments}
        commentLoadErrorMessage={commentLoadErrorMessage}
      />
    </>
  );
}
