import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApprovalDraftCommentThread } from '../pages/documents/approvals/components/ApprovalDraftCommentThread';
import type { DraftComment } from '../pages/documents/approvals/types';

describe('ApprovalDraftCommentThread', () => {
  it('shows like count and toggles likes for manual comments', async () => {
    const comments: DraftComment[] = [
      {
        id: '3001',
        author: '홍길동',
        text: '좋아요가 필요한 의견입니다.',
        createdAt: '2026-08-04 11:00',
        createdByLoginCode: '3001',
        likeCount: 3,
        likedByMe: false,
        replies: [],
      },
    ];

    const user = userEvent.setup();
    render(
      <ApprovalDraftCommentThread
        comments={comments}
        onAddComment={() => undefined}
        replyDraftByCommentId={{}}
        onChangeReplyDraft={() => undefined}
        onAddReply={() => undefined}
        onEditComment={() => undefined}
        onDeleteComment={() => undefined}
        onToggleLikeComment={() => undefined}
        currentUserLoginCode="3001"
      />,
    );

    expect(
      screen.getByRole('button', { name: '좋아요 3' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '좋아요 3' }));
  });

  it('shows edit and delete only for manual comments and keeps system comments read only', async () => {
    const comments: DraftComment[] = [
      {
        id: '1001',
        author: '시스템',
        text: '[시스템] 결재가 진행되었습니다.',
        createdAt: '2026-08-04 09:00',
        isSystem: true,
        createdByLoginCode: 'system',
        replies: [],
      },
      {
        id: '1002',
        author: '홍길동',
        text: '수동으로 남긴 의견입니다.',
        createdAt: '2026-08-04 09:05',
        createdByLoginCode: '3001',
        likeCount: 0,
        likedByMe: false,
        replies: [],
      },
    ];

    const user = userEvent.setup();
    render(
      <ApprovalDraftCommentThread
        comments={comments}
        onAddComment={() => undefined}
        replyDraftByCommentId={{}}
        onChangeReplyDraft={() => undefined}
        onAddReply={() => undefined}
        onEditComment={() => undefined}
        onDeleteComment={() => undefined}
        onToggleLikeComment={() => undefined}
        currentUserLoginCode="3001"
      />,
    );

    expect(screen.queryByRole('menuitem', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: '삭제' })).toBeNull();

    await user.click(screen.getAllByRole('button', { name: '댓글 메뉴' })[0]);
    expect(screen.getByRole('menuitem', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
    expect(
      screen.getByText('[시스템] 결재가 진행되었습니다.'),
    ).toBeInTheDocument();
  });

  it('renders deleted comments as a tombstone message', () => {
    const comments: DraftComment[] = [
      {
        id: '2001',
        author: '홍길동',
        text: '사용자에 의해 삭제되었습니다.',
        createdAt: '2026-08-04 10:00',
        createdByLoginCode: '3001',
        isDeleted: true,
        likeCount: 0,
        likedByMe: false,
        replies: [],
      },
    ];

    render(
      <ApprovalDraftCommentThread
        comments={comments}
        onAddComment={() => undefined}
        replyDraftByCommentId={{}}
        onChangeReplyDraft={() => undefined}
        onAddReply={() => undefined}
        onEditComment={() => undefined}
        onDeleteComment={() => undefined}
        onToggleLikeComment={() => undefined}
        currentUserLoginCode="3001"
      />,
    );

    expect(
      screen.getByText(/사용자에 의해 삭제\s*되었습니다\./),
    ).toBeInTheDocument();
  });
});
