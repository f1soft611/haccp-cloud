import { useState } from 'react';
import type { DraftComment } from '../types';
import { formatNow } from '../utils/approvalDraftUtils';

type UseApprovalDraftCommentsResult = {
  comments: DraftComment[];
  replyDraftByCommentId: Record<string, string>;
  setReplyDraft: (commentId: string, next: string) => void;
  addComment: (text: string) => void;
  addReply: (commentId: string) => void;
};

export function useApprovalDraftComments(
  authorName: string,
  authorProfileImage?: string,
): UseApprovalDraftCommentsResult {
  const [comments, setComments] = useState<DraftComment[]>([]);
  const [replyDraftByCommentId, setReplyDraftByCommentId] = useState<
    Record<string, string>
  >({});

  const addComment = (text: string) => {
    const nextText = text.trim();
    if (!nextText) {
      return;
    }

    setComments((prev) => [
      {
        id: `comment-${Date.now()}`,
        author: authorName,
        authorProfileImage,
        text: nextText,
        createdAt: formatNow(new Date()),
        replies: [],
      },
      ...prev,
    ]);
  };

  const addReply = (commentId: string) => {
    const draft = (replyDraftByCommentId[commentId] || '').trim();
    if (!draft) {
      return;
    }

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        return {
          ...comment,
          replies: [
            ...comment.replies,
            {
              id: `reply-${Date.now()}`,
              author: authorName,
              authorProfileImage,
              text: draft,
              createdAt: formatNow(new Date()),
            },
          ],
        };
      }),
    );

    setReplyDraftByCommentId((prev) => ({
      ...prev,
      [commentId]: '',
    }));
  };

  const setReplyDraft = (commentId: string, next: string) => {
    setReplyDraftByCommentId((prev) => ({
      ...prev,
      [commentId]: next,
    }));
  };

  return {
    comments,
    replyDraftByCommentId,
    setReplyDraft,
    addComment,
    addReply,
  };
}
