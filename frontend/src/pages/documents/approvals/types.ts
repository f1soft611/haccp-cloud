import type { UserItem } from '../../../services/organization/usersService';

export type DraftReply = {
  id: string;
  createdByLoginCode?: string;
  author: string;
  authorProfileImage?: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  isSystem?: boolean;
  isDeleted?: boolean;
};

export type DraftComment = {
  id: string;
  createdByLoginCode?: string;
  author: string;
  authorProfileImage?: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  isSystem?: boolean;
  isDeleted?: boolean;
  replies: DraftReply[];
};

export type ApprovalRole = 'reviewer' | 'approver';

export type ApprovalLine = {
  role: ApprovalRole;
  title: string;
  name: string;
  signatureImage?: string;
};

export type UserOption = UserItem;
