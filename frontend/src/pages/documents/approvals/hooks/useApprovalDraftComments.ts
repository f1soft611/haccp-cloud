import { useState } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DraftComment, DraftReply } from '../types';
import { formatNow } from '../utils/approvalDraftUtils';
import {
  deleteHaccpWorkApprovalComment,
  createHaccpWorkApprovalComment,
  listHaccpWorkApprovalComments,
  toggleHaccpWorkApprovalCommentLike,
  updateHaccpWorkApprovalComment,
} from '../../../../services/documents/haccpBaseWorkService';

type UseApprovalDraftCommentsResult = {
  comments: DraftComment[];
  replyDraftByCommentId: Record<string, string>;
  setReplyDraft: (commentId: string, next: string) => void;
  addComment: (text: string) => void;
  addReply: (commentId: string) => void;
  editComment: (commentId: string, nextText: string) => void;
  deleteComment: (commentId: string) => void;
  toggleLikeComment: (commentId: string) => void;
  refreshComments: () => Promise<void>;
  commentLoadErrorMessage: string;
};

function normalizeCommentText(value: string): string {
  return String(value || '').trim();
}

function mapLocalCommentTree(
  comments: DraftComment[],
  commentId: string,
  updater: (comment: DraftComment) => DraftComment,
): DraftComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }

    if (!comment.replies.length) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === commentId
          ? (updater({
              ...reply,
              replies: [],
            }) as unknown as DraftReply)
          : reply,
      ),
    };
  });
}

export function useApprovalDraftComments(
  tenantCode: string,
  approvalId: string,
  authorName: string,
  authorProfileImage?: string,
  userId?: string,
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
        createdByLoginCode: item.createdByLoginCode,
        author: item.author,
        authorProfileImage: item.authorProfileImage,
        text: item.text,
        createdAt: item.createdAt,
        likeCount: item.likeCount,
        likedByMe: item.likedByMe,
        isSystem: item.isSystem,
        isDeleted: item.isDeleted,
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
        createdByLoginCode: comment.createdByLoginCode,
        author: comment.author,
        authorProfileImage: comment.authorProfileImage,
        text: comment.text,
        createdAt: comment.createdAt,
        likeCount: comment.likeCount,
        likedByMe: comment.likedByMe,
        isSystem: comment.isSystem,
        isDeleted: comment.isDeleted,
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

  const updateCommentMutation = useMutation({
    mutationFn: async (params: { commentId: string; comment: string }) => {
      return updateHaccpWorkApprovalComment({
        tenantCode,
        approvalId,
        commentId: params.commentId,
        comment: params.comment,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['approval-comments', tenantCode, approvalId],
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return deleteHaccpWorkApprovalComment({
        tenantCode,
        approvalId,
        commentId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['approval-comments', tenantCode, approvalId],
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return toggleHaccpWorkApprovalCommentLike({
        tenantCode,
        approvalId,
        commentId,
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
        likeCount: 0,
        likedByMe: false,
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
    if (!targetComment || targetComment.isSystem || targetComment.isDeleted) {
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
        createdByLoginCode: userId,
        author: authorName,
        authorProfileImage,
        text: draft,
        createdAt: formatNow(new Date()),
        likeCount: 0,
        likedByMe: false,
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

  const editComment = (commentId: string, nextText: string) => {
    const normalized = normalizeCommentText(nextText);
    if (!normalized) {
      return;
    }

    if (approvalId) {
      if (updateCommentMutation.isPending) {
        return;
      }
      updateCommentMutation.mutate({ commentId, comment: normalized });
      return;
    }

    setLocalComments((prev) =>
      mapLocalCommentTree(prev, commentId, (comment) => ({
        ...comment,
        text: normalized,
      })),
    );
  };

  const deleteComment = (commentId: string) => {
    if (approvalId) {
      if (deleteCommentMutation.isPending) {
        return;
      }
      deleteCommentMutation.mutate(commentId);
      return;
    }

    setLocalComments((prev) =>
      mapLocalCommentTree(prev, commentId, (comment) => ({
        ...comment,
        text: '사용자에 의해 삭제 되었습니다.',
        isDeleted: true,
        isSystem: false,
      })),
    );
  };

  const toggleLikeComment = (commentId: string) => {
    const targetComment =
      comments.find((comment) => comment.id === commentId) ??
      comments
        .flatMap((comment) => comment.replies)
        .find((reply) => reply.id === commentId);
    if (!targetComment || targetComment.isSystem || targetComment.isDeleted) {
      return;
    }

    if (approvalId) {
      if (toggleLikeMutation.isPending) {
        return;
      }
      toggleLikeMutation.mutate(commentId);
      return;
    }

    setLocalComments((prev) =>
      mapLocalCommentTree(prev, commentId, (comment) => ({
        ...comment,
        likedByMe: !comment.likedByMe,
        likeCount: Math.max(
          0,
          (comment.likeCount || 0) + (comment.likedByMe ? -1 : 1),
        ),
      })),
    );
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
    editComment,
    deleteComment,
    toggleLikeComment,
    refreshComments,
    commentLoadErrorMessage,
  };
}
