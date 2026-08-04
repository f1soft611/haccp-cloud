import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import ReplyRounded from '@mui/icons-material/ReplyRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  TextField,
} from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { DraftComment } from '../types';

type ApprovalDraftCommentThreadProps = {
  comments: DraftComment[];
  onAddComment: (text: string) => void;
  replyDraftByCommentId: Record<string, string>;
  onChangeReplyDraft: (commentId: string, next: string) => void;
  onAddReply: (commentId: string) => void;
  onEditComment: (commentId: string, nextText: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUserLoginCode?: string;
  canWriteComments?: boolean;
  commentLoadErrorMessage?: string;
};

function toInitial(name: string): string {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'U';
}

function parseCommentDate(value: string): Date | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatAbsoluteTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function formatRelativeTimestamp(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) {
    return '방금 전';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}분 전`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}시간 전`;
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay}일 전`;
  }

  return formatAbsoluteTimestamp(date);
}

function renderCommentTimestamp(value: string): {
  relative: string;
  absolute: string;
} {
  const parsed = parseCommentDate(value);
  if (!parsed) {
    const fallback = String(value || '').trim() || '-';
    return { relative: fallback, absolute: fallback };
  }

  return {
    relative: formatRelativeTimestamp(parsed),
    absolute: formatAbsoluteTimestamp(parsed),
  };
}

function formatReplyTimestamp(value: string): string {
  const parsed = parseCommentDate(value);
  if (!parsed) {
    return String(value || '').trim() || '-';
  }
  return formatAbsoluteTimestamp(parsed);
}

function isEditableComment(
  comment: Pick<DraftComment, 'isSystem' | 'isDeleted' | 'createdByLoginCode'>,
  currentUserLoginCode?: string,
): boolean {
  const loginCode = String(currentUserLoginCode || '').trim();
  return Boolean(
    loginCode &&
    comment.createdByLoginCode &&
    comment.createdByLoginCode === loginCode &&
    !comment.isSystem &&
    !comment.isDeleted,
  );
}

function renderCommentBody(comment: Pick<DraftComment, 'text' | 'isDeleted'>) {
  if (comment.isDeleted) {
    return '사용자에 의해 삭제 되었습니다.';
  }

  return comment.text;
}

export function ApprovalDraftCommentThread(
  props: ApprovalDraftCommentThreadProps,
) {
  const {
    comments,
    onAddComment,
    replyDraftByCommentId,
    onChangeReplyDraft,
    onAddReply,
    onEditComment,
    onDeleteComment,
    currentUserLoginCode,
    canWriteComments = true,
    commentLoadErrorMessage = '',
  } = props;
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);
  const [opinionDraft, setOpinionDraft] = useState('');
  const [replyComposerOpen, setReplyComposerOpen] = useState<
    Record<string, boolean>
  >({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [editTargetCommentId, setEditTargetCommentId] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState('');
  const [commentMenuAnchor, setCommentMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [commentMenuTargetId, setCommentMenuTargetId] = useState('');

  const handleSubmitOpinion = () => {
    const nextText = opinionDraft.trim();
    if (!nextText) {
      return;
    }

    onAddComment(nextText);
    setOpinionDraft('');
    setIsOpinionModalOpen(false);
  };

  const toggleReplyComposer = (commentId: string) => {
    setReplyComposerOpen((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const openEditDialog = (comment: DraftComment) => {
    setEditTargetCommentId(comment.id);
    setEditDraft(comment.text);
    setIsEditModalOpen(true);
  };

  const submitEdit = () => {
    const nextText = editDraft.trim();
    if (!editTargetCommentId || !nextText) {
      return;
    }

    onEditComment(editTargetCommentId, nextText);
    setIsEditModalOpen(false);
    setEditTargetCommentId('');
    setEditDraft('');
  };

  const openDeleteConfirm = (commentId: string) => {
    setDeleteTargetCommentId(commentId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetCommentId) {
      return;
    }

    onDeleteComment(deleteTargetCommentId);
    setIsDeleteConfirmOpen(false);
    setDeleteTargetCommentId('');
  };

  const openCommentMenu = (
    event: MouseEvent<HTMLElement>,
    commentId: string,
  ) => {
    setCommentMenuAnchor(event.currentTarget);
    setCommentMenuTargetId(commentId);
  };

  const closeCommentMenu = () => {
    setCommentMenuAnchor(null);
    setCommentMenuTargetId('');
  };

  const activeComment = comments.find(
    (comment) => comment.id === commentMenuTargetId,
  );
  const activeReply = comments
    .flatMap((comment) => comment.replies)
    .find((reply) => reply.id === commentMenuTargetId);
  const menuTarget = activeComment ?? activeReply;

  return (
    <Paper
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.12)
            : alpha(theme.palette.primary.main, 0.14),
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `linear-gradient(155deg, ${alpha('#0f172a', 0.96)} 0%, ${alpha('#111827', 0.96)} 100%)`
            : `linear-gradient(155deg, ${alpha('#f8fafc', 0.96)} 0%, ${alpha('#f1f5f9', 0.9)} 100%)`,
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? `0 16px 36px ${alpha('#020617', 0.45)}`
            : `0 16px 34px ${alpha('#0f172a', 0.08)}`,
      }}
    >
      <Stack spacing={1.75}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.info.light, 0.14)
                    : alpha(theme.palette.info.main, 0.12),
                color: 'info.main',
              }}
            >
              <ChatBubbleOutlineRounded fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                결재 댓글 스레드
              </Typography>
              <Typography variant="body2" color="text.secondary">
                댓글 {comments.length}개
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<ChatBubbleOutlineRounded />}
            disabled={!canWriteComments}
            onClick={() => setIsOpinionModalOpen(true)}
            sx={{
              borderRadius: 2,
              px: 1.75,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? `0 8px 18px ${alpha(theme.palette.primary.dark, 0.45)}`
                  : `0 10px 20px ${alpha(theme.palette.primary.main, 0.26)}`,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            의견 등록
          </Button>
        </Stack>

        {commentLoadErrorMessage ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {commentLoadErrorMessage}
          </Alert>
        ) : null}

        {comments.length === 0 ? (
          <Box
            sx={{
              borderRadius: 2,
              border: '1px dashed',
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.18)
                  : alpha(theme.palette.primary.main, 0.24),
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.02)
                  : alpha(theme.palette.common.white, 0.75),
              py: 2.5,
              px: 1.25,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              등록된 결재의견이 없습니다.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {comments.map((comment) =>
              (() => {
                const timeMeta = renderCommentTimestamp(comment.createdAt);
                const canManageComment = isEditableComment(
                  comment,
                  currentUserLoginCode,
                );
                const canReplyToComment =
                  !comment.isSystem && !comment.isDeleted;
                return (
                  <Box
                    key={comment.id}
                    sx={{
                      px: 1.1,
                      py: 1.2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.08)
                          : alpha(theme.palette.common.black, 0.08),
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.03)
                          : alpha(theme.palette.common.white, 0.88),
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: (theme) =>
                          theme.palette.mode === 'dark'
                            ? `0 8px 16px ${alpha('#020617', 0.3)}`
                            : `0 10px 18px ${alpha('#0f172a', 0.08)}`,
                      },
                    }}
                  >
                    <Stack spacing={1.1}>
                      <Stack
                        direction="row"
                        spacing={1.1}
                        alignItems="flex-start"
                      >
                        <Avatar
                          src={comment.authorProfileImage || undefined}
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {toInitial(comment.author)}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                              useFlexGap
                              flexWrap="wrap"
                            >
                              <Typography variant="body2" fontWeight={800}>
                                {comment.author}
                              </Typography>
                              {comment.isSystem ? (
                                <Chip
                                  size="small"
                                  icon={
                                    <NotificationsActiveRounded
                                      sx={{ fontSize: 13 }}
                                    />
                                  }
                                  label="시스템 알림"
                                  color="default"
                                  variant="filled"
                                  sx={{
                                    height: 20,
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                />
                              ) : null}
                              <Tooltip
                                title={timeMeta.absolute}
                                arrow
                                placement="top"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    letterSpacing: 0,
                                  }}
                                >
                                  {timeMeta.relative}
                                </Typography>
                              </Tooltip>
                            </Stack>
                          </Stack>

                          <Typography
                            variant="body1"
                            sx={{
                              mt: 0.3,
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.55,
                              color: 'text.primary',
                              fontStyle: comment.isDeleted
                                ? 'italic'
                                : 'normal',
                              color: comment.isDeleted
                                ? 'text.secondary'
                                : 'text.primary',
                            }}
                          >
                            {renderCommentBody(comment)}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1.75}
                            alignItems="center"
                            sx={{ mt: 0.8 }}
                          >
                            <Button
                              size="small"
                              variant="text"
                              startIcon={
                                <FavoriteBorderRounded fontSize="small" />
                              }
                              sx={{ minWidth: 0, px: 0.3, borderRadius: 1.5 }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                0
                              </Typography>
                            </Button>

                            <Button
                              size="small"
                              variant="text"
                              startIcon={<ReplyRounded fontSize="small" />}
                              sx={{ minWidth: 0, px: 0.3, borderRadius: 1.5 }}
                              disabled={!canWriteComments || !canReplyToComment}
                              onClick={() => toggleReplyComposer(comment.id)}
                            >
                              {!canReplyToComment
                                ? '답글 비활성'
                                : `답글 ${comment.replies.length}`}
                            </Button>

                            {canManageComment ? (
                              <IconButton
                                size="small"
                                aria-label="댓글 메뉴"
                                onClick={(event) =>
                                  openCommentMenu(event, comment.id)
                                }
                                sx={{ color: 'text.secondary' }}
                              >
                                <MoreHorizRounded fontSize="small" />
                              </IconButton>
                            ) : null}
                          </Stack>

                          {comment.replies.length > 0 ? (
                            <Stack
                              spacing={0.9}
                              sx={{
                                mt: 1.15,
                                pl: 1.25,
                                borderLeft: '2px solid',
                                borderColor: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.info.light, 0.35)
                                    : alpha(theme.palette.info.main, 0.3),
                              }}
                            >
                              {comment.replies.map((reply) => (
                                <Stack
                                  key={reply.id}
                                  direction="row"
                                  spacing={0.9}
                                  alignItems="flex-start"
                                >
                                  <Avatar
                                    src={reply.authorProfileImage || undefined}
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {toInitial(reply.author)}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {reply.author} ·{' '}
                                      {formatReplyTimestamp(reply.createdAt)}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.5,
                                        color: reply.isDeleted
                                          ? 'text.secondary'
                                          : 'text.primary',
                                        fontStyle: reply.isDeleted
                                          ? 'italic'
                                          : 'normal',
                                      }}
                                    >
                                      {renderCommentBody(reply)}
                                    </Typography>

                                    {isEditableComment(
                                      reply,
                                      currentUserLoginCode,
                                    ) ? (
                                      <IconButton
                                        size="small"
                                        aria-label="댓글 메뉴"
                                        onClick={(event) =>
                                          openCommentMenu(event, reply.id)
                                        }
                                        sx={{
                                          mt: 0.2,
                                          color: 'text.secondary',
                                        }}
                                      >
                                        <MoreHorizRounded fontSize="small" />
                                      </IconButton>
                                    ) : null}
                                  </Box>
                                </Stack>
                              ))}
                            </Stack>
                          ) : null}

                          {canReplyToComment &&
                          replyComposerOpen[comment.id] ? (
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={0.8}
                              sx={{ mt: 1.1 }}
                            >
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="대댓글을 입력하세요"
                                multiline
                                minRows={2}
                                disabled={!canWriteComments}
                                value={replyDraftByCommentId[comment.id] || ''}
                                onChange={(event) =>
                                  onChangeReplyDraft(
                                    comment.id,
                                    event.target.value,
                                  )
                                }
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.75,
                                  },
                                }}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SendRounded />}
                                disabled={!canWriteComments}
                                onClick={() => onAddReply(comment.id)}
                                sx={{
                                  minWidth: 88,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  borderRadius: 1.75,
                                }}
                              >
                                등록
                              </Button>
                            </Stack>
                          ) : null}
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })(),
            )}
          </Stack>
        )}
      </Stack>

      <FormDialog
        open={isEditModalOpen}
        title="댓글 수정"
        description="수정한 내용은 즉시 댓글 스레드에 반영됩니다."
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTargetCommentId('');
          setEditDraft('');
        }}
        actions={
          <>
            <Button
              variant="contained"
              onClick={submitEdit}
              disabled={!editDraft.trim()}
              sx={{ borderRadius: 1.75, minWidth: 84 }}
            >
              수정
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditTargetCommentId('');
                setEditDraft('');
              }}
              sx={{ borderRadius: 1.75, minWidth: 84 }}
            >
              취소
            </Button>
          </>
        }
      >
        <TextField
          label="댓글 내용"
          multiline
          minRows={4}
          fullWidth
          value={editDraft}
          onChange={(event) => setEditDraft(event.target.value)}
        />
      </FormDialog>

      <FormDialog
        open={isDeleteConfirmOpen}
        title="댓글 삭제 확인"
        description="삭제된 댓글은 본문 대신 삭제 문구로 표시됩니다."
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTargetCommentId('');
        }}
        actions={
          <>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              sx={{ borderRadius: 1.75, minWidth: 84 }}
            >
              삭제
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeleteTargetCommentId('');
              }}
              sx={{ borderRadius: 1.75, minWidth: 84 }}
            >
              취소
            </Button>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary">
          사용자가 직접 입력한 댓글만 삭제할 수 있습니다.
        </Typography>
      </FormDialog>

      <Menu
        anchorEl={commentMenuAnchor}
        open={Boolean(commentMenuAnchor)}
        onClose={closeCommentMenu}
        PaperProps={{
          sx: {
            mt: 0.75,
            borderRadius: 2,
            minWidth: 120,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 14px 30px rgba(2, 6, 23, 0.45)'
                : '0 14px 28px rgba(15, 23, 42, 0.16)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuTarget) {
              openEditDialog(menuTarget);
            }
            closeCommentMenu();
          }}
        >
          수정
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuTarget) {
              openDeleteConfirm(menuTarget.id);
            }
            closeCommentMenu();
          }}
        >
          삭제
        </MenuItem>
      </Menu>

      <FormDialog
        open={isOpinionModalOpen}
        title="결재의견 등록"
        description="등록된 의견은 최신 순으로 댓글 스레드 상단에 표시됩니다."
        onClose={() => {
          setIsOpinionModalOpen(false);
        }}
        contentSx={{
          '& .comment-opinion-editor': {
            p: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.1)
                : alpha(theme.palette.primary.main, 0.16),
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.white, 0.86),
          },
          '& .comment-opinion-editor .MuiOutlinedInput-root': {
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.white, 0.95),
          },
        }}
        actions={
          <>
            <Button
              variant="contained"
              onClick={handleSubmitOpinion}
              disabled={!canWriteComments}
              sx={{
                borderRadius: 1.75,
                minWidth: 84,
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? `0 8px 18px ${alpha(theme.palette.primary.dark, 0.42)}`
                    : `0 10px 20px ${alpha(theme.palette.primary.main, 0.24)}`,
              }}
            >
              등록
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpinionModalOpen(false);
              }}
              sx={{ borderRadius: 1.75, minWidth: 84 }}
            >
              취소
            </Button>
          </>
        }
      >
        <Stack spacing={1} className="comment-opinion-editor">
          <TextField
            label="결재의견"
            placeholder="의견을 입력하세요"
            multiline
            minRows={4}
            disabled={!canWriteComments}
            value={opinionDraft}
            onChange={(event) => setOpinionDraft(event.target.value)}
            fullWidth
          />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              불필요한 개인정보나 민감 정보는 입력하지 마세요.
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {opinionDraft.trim().length}자
            </Typography>
          </Stack>
        </Stack>
      </FormDialog>
    </Paper>
  );
}
