import type { UserItem } from '../../../services/organization/usersService';

export type DraftReply = {
  id: string;
  author: string;
  authorProfileImage?: string;
  text: string;
  createdAt: string;
};

export type DraftComment = {
  id: string;
  author: string;
  authorProfileImage?: string;
  text: string;
  createdAt: string;
  isSystem?: boolean;
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
