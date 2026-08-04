import { useState } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DraftComment, DraftReply } from '../types';
import { formatNow } from '../utils/approvalDraftUtils';
import {
  createHaccpWorkApprovalComment,
  listHaccpWorkApprovalComments,
} from '../../../../services/documents/haccpBaseWorkService';

type UseApprovalDraftCommentsResult = {
  comments: DraftComment[];
  replyDraftByCommentId: Record<string, string>;
  setReplyDraft: (commentId: string, next: string) => void;
  addComment: (text: string) => void;
  addReply: (commentId: string) => void;
  refreshComments: () => Promise<void>;
  commentLoadErrorMessage: string;
};

export function useApprovalDraftComments(
  tenantCode: string,
  approvalId: string,
  authorName: string,
  authorProfileImage?: string,
): UseApprovalDraftCommentsResult {
  const [localComments, setLocalComments] = useState<DraftComment[]>([]);
  const [replyDraftByCommentId, setReplyDraftByCommentId] = useState<
    Record<string, string>
  >({});
  const queryClient = useQueryClient();

  const approvalCommentsQuery = useQuery({
    queryKey: ['approval-comments', tenantCode, approvalId],
    queryFn: () =>
      listHaccpWorkApprovalComments({
        tenantCode,
        approvalId,
      }),
    enabled: Boolean(tenantCode && approvalId),
    retry: 1,
  });

  const comments = useMemo(() => {
    if (!approvalId) {
      return localComments;
    }

    const serverItems = approvalCommentsQuery.data ?? [];
    const byId: Record<string, DraftComment> = {};
    const ordered: DraftComment[] = [];

    for (const item of serverItems) {
      const id = String(item.id || '').trim();
      if (!id) {
        continue;
      }

      const comment: DraftComment = {
        id,
        author: item.author,
        authorProfileImage: item.authorProfileImage,
        text: item.text,
        createdAt: item.createdAt,
        isSystem: item.isSystem,
        replies: [],
      };
      byId[id] = comment;
      ordered.push(comment);
    }

    const roots: DraftComment[] = [];
    for (const item of serverItems) {
      const id = String(item.id || '').trim();
      if (!id) {
        continue;
      }

      const parentId = String(item.parentCommentId || '').trim();
      const comment = byId[id];
      if (!comment) {
        continue;
      }

      if (!parentId) {
        roots.push(comment);
        continue;
      }

      const parent = byId[parentId];
      if (!parent || parent.isSystem) {
        roots.push(comment);
        continue;
      }

      parent.replies.push({
        id: comment.id,
        author: comment.author,
        authorProfileImage: comment.authorProfileImage,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }

    return roots.length > 0 ? roots : ordered;
  }, [approvalCommentsQuery.data, approvalId, localComments]);

  const commentLoadErrorMessage = useMemo(() => {
    if (!approvalCommentsQuery.isError) {
      return '';
    }

    const error = approvalCommentsQuery.error as {
      response?: { data?: { message?: string } };
      message?: string;
    } | null;
    return (
      error?.response?.data?.message?.trim() ||
      error?.message?.trim() ||
      '댓글을 불러오지 못했습니다.'
    );
  }, [approvalCommentsQuery.error, approvalCommentsQuery.isError]);

  const createCommentMutation = useMutation({
    mutationFn: async (params: {
      comment: string;
      parentCommentId?: string;
    }) => {
      return createHaccpWorkApprovalComment({
        tenantCode,
        approvalId,
        comment: params.comment,
        parentCommentId: params.parentCommentId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['approval-comments', tenantCode, approvalId],
      });
    },
  });

  const addComment = (text: string) => {
    const nextText = text.trim();
    if (!nextText) {
      return;
    }

    if (approvalId) {
      if (createCommentMutation.isPending) {
        return;
      }
      createCommentMutation.mutate({ comment: nextText });
      return;
    }

    setLocalComments((prev) => [
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

    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment || targetComment.isSystem) {
      return;
    }

    if (approvalId) {
      if (createCommentMutation.isPending) {
        return;
      }
      createCommentMutation.mutate({
        comment: draft,
        parentCommentId: commentId,
      });
    } else {
      const nextReply: DraftReply = {
        id: `reply-${Date.now()}`,
        author: authorName,
        authorProfileImage,
        text: draft,
        createdAt: formatNow(new Date()),
      };

      setLocalComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }
          return {
            ...comment,
            replies: [...comment.replies, nextReply],
          };
        }),
      );
    }

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

  const refreshComments = async () => {
    if (!tenantCode || !approvalId) {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ['approval-comments', tenantCode, approvalId],
    });
  };

  return {
    comments,
    replyDraftByCommentId,
    setReplyDraft,
    addComment,
    addReply,
    refreshComments,
    commentLoadErrorMessage,
  };
}
