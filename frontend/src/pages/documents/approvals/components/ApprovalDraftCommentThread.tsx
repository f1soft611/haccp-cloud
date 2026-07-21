import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import ReplyRounded from '@mui/icons-material/ReplyRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { DraftComment } from '../types';

type ApprovalDraftCommentThreadProps = {
  comments: DraftComment[];
  onAddComment: (text: string) => void;
  replyDraftByCommentId: Record<string, string>;
  onChangeReplyDraft: (commentId: string, next: string) => void;
  onAddReply: (commentId: string) => void;
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

export function ApprovalDraftCommentThread(
  props: ApprovalDraftCommentThreadProps,
) {
  const {
    comments,
    onAddComment,
    replyDraftByCommentId,
    onChangeReplyDraft,
    onAddReply,
    canWriteComments = true,
    commentLoadErrorMessage = '',
  } = props;
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);
  const [opinionDraft, setOpinionDraft] = useState('');
  const [replyComposerOpen, setReplyComposerOpen] = useState<
    Record<string, boolean>
  >({});

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

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h6" fontWeight={800}>
            결재 댓글 스레드
          </Typography>
          <Button
            variant="contained"
            startIcon={<ChatBubbleOutlineRounded />}
            disabled={!canWriteComments}
            onClick={() => setIsOpinionModalOpen(true)}
          >
            의견 등록
          </Button>
        </Stack>

        {commentLoadErrorMessage ? (
          <Alert severity="warning">{commentLoadErrorMessage}</Alert>
        ) : null}

        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            등록된 결재의견이 없습니다.
          </Typography>
        ) : (
          <Stack>
            {comments.map((comment, index) =>
              (() => {
                const timeMeta = renderCommentTimestamp(comment.createdAt);
                return (
                  <Box
                    key={comment.id}
                    sx={{
                      py: 1.5,
                      borderTop: index === 0 ? '1px solid' : 'none',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
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
                                  label="시스템"
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

                            <IconButton
                              size="small"
                              sx={{ color: 'text.secondary' }}
                            >
                              <MoreHorizRounded fontSize="small" />
                            </IconButton>
                          </Stack>

                          <Typography
                            variant="body1"
                            sx={{
                              mt: 0.3,
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.55,
                            }}
                          >
                            {comment.text}
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
                              sx={{ minWidth: 0, px: 0.3 }}
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
                              sx={{ minWidth: 0, px: 0.3 }}
                              disabled={!canWriteComments || comment.isSystem}
                              onClick={() => toggleReplyComposer(comment.id)}
                            >
                              {comment.isSystem
                                ? '답글 비활성'
                                : `답글 ${comment.replies.length}`}
                            </Button>
                          </Stack>

                          {comment.replies.length > 0 ? (
                            <Stack
                              spacing={0.9}
                              sx={{
                                mt: 1.15,
                                pl: 1.25,
                                borderLeft: '2px solid',
                                borderColor: 'divider',
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
                                      {reply.author} · {reply.createdAt}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {reply.text}
                                    </Typography>
                                  </Box>
                                </Stack>
                              ))}
                            </Stack>
                          ) : null}

                          {!comment.isSystem &&
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
        open={isOpinionModalOpen}
        title="결재의견 등록"
        description="등록된 의견은 최신 순으로 댓글 스레드 상단에 표시됩니다."
        onClose={() => {
          setIsOpinionModalOpen(false);
        }}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpinionModalOpen(false);
              }}
            >
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitOpinion}
              disabled={!canWriteComments}
            >
              등록
            </Button>
          </>
        }
      >
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
      </FormDialog>
    </Paper>
  );
}
