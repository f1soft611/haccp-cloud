import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/core';
import { useParams, useSearchParams } from 'react-router-dom';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import { getHaccpWorkDraftTemplate } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';
import { listUsers } from '../../../../services/organization/usersService';
import { useAuthStore } from '../../../../shared/store/authStore';
import {
  resolveDocumentFieldValues,
  type DocumentFieldValues,
} from '../../../../editor/utils/documentFieldValues';
import { parseTemplateJson } from '../utils/approvalDraftUtils';
import { isDocumentOwner } from '../../../../shared/utils/ownershipUtils';

type UseApprovalDraftWriteDataResult = {
  baseId?: string;
  idType: 'work' | 'approval';
  tenantCode: string;
  userId: string;
  displayName: string;
  drafterDisplayName: string;
  title: string;
  setTitle: (next: string) => void;
  referenceIds: string[];
  setReferenceIds: (next: string[]) => void;
  workDetailQuery: {
    isError: boolean;
    isFetched: boolean;
  };
  work?: HaccpBaseWorkItem;
  documentFieldValues: DocumentFieldValues;
  resolvedEditorContent: JSONContent;
  resolvedEditorHtml: string;
  handleChangeEditor: (nextContent: JSONContent, nextHtml: string) => void;
  referenceOptions: UserItem[];
  selectedReferences: UserItem[];
  drafterProfile?: UserItem;
  reviewerProfile?: UserItem;
  approverProfile?: UserItem;
  isOwner: boolean;
  isReadOnly: boolean;
  canTempSave: boolean;
  canSubmit: boolean;
  canSubmitCancel: boolean;
  canApprove: boolean;
  canConfirm: boolean;
  canReject: boolean;
  approvalEventType?: 'review_approve' | 'final_approve';
  referenceEventType?: 'reference_confirm';
  rejectEventType?: 'review_return' | 'final_return';
};

export function useApprovalDraftWriteData(): UseApprovalDraftWriteDataResult {
  const { baseId } = useParams();
  const [searchParams] = useSearchParams();
  const idType =
    searchParams.get('idType') === 'approval' ? 'approval' : 'work';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantCode = useAuthStore((state) => state.tenantCode || '');
  const userId = useAuthStore((state) => state.userId || 'tenant_admin');
  const displayName = useAuthStore((state) => state.displayName || '관리자');
  const departmentName = useAuthStore((state) => state.departmentName || '');

  const [title, setTitle] = useState('');
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const [editorHtml, setEditorHtml] = useState('');
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const workDetailQuery = useQuery({
    queryKey: ['haccp-work-draft-template', tenantCode, baseId, idType],
    queryFn: () =>
      getHaccpWorkDraftTemplate({
        tenantCode,
        id: baseId ?? '',
        idType,
      }),
    enabled: Boolean(isAuthenticated && tenantCode && baseId),
    retry: 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const usersQuery = useQuery({
    queryKey: ['users', tenantCode, 'approval-write'],
    queryFn: () => listUsers(tenantCode),
    enabled: Boolean(isAuthenticated && tenantCode),
    retry: 1,
  });

  const work = workDetailQuery.data;

  useEffect(() => {
    setTitle('');
    setReferenceIds([]);
    setEditorContent(null);
    setEditorHtml('');
    setHasUserEdited(false);
  }, [baseId, idType]);

  useEffect(() => {
    if (!workDetailQuery.isFetched) {
      return;
    }

    const fetchedTitle = (work?.title || '').trim();
    if (!fetchedTitle) {
      return;
    }

    setTitle((prev) => (prev.trim() ? prev : fetchedTitle));
  }, [work?.title, workDetailQuery.isFetched]);

  useEffect(() => {
    if (!workDetailQuery.isFetched) {
      return;
    }

    const fetchedReferenceIds = work?.referenceIds ?? [];
    if (!fetchedReferenceIds.length) {
      return;
    }

    setReferenceIds((prev) => (prev.length > 0 ? prev : fetchedReferenceIds));
  }, [work?.referenceIds, workDetailQuery.isFetched]);

  const currentUserProfile = useMemo(() => {
    const fromUsers = (usersQuery.data ?? []).find((user) => {
      return user.id === userId || user.name === displayName;
    });

    return {
      userId: (fromUsers?.id || '').trim() || userId,
      displayName: fromUsers?.name || displayName,
      department: fromUsers?.department || departmentName || '',
    };
  }, [departmentName, displayName, userId, usersQuery.data]);

  const templateContent = useMemo(() => {
    return parseTemplateJson(work?.templateJson);
  }, [work?.templateJson]);

  const resolvedEditorContent =
    hasUserEdited && editorContent ? editorContent : templateContent;
  const resolvedEditorHtml = hasUserEdited
    ? editorHtml
    : (work?.templateHtml ?? '');

  const referenceOptions = useMemo(() => {
    const reviewerId = work?.reviewerId || '';
    const approverId = work?.approverId || '';

    return (usersQuery.data ?? []).filter((user) => {
      if (!user.id) {
        return false;
      }
      if (user.id === reviewerId || user.id === approverId) {
        return false;
      }
      return true;
    });
  }, [usersQuery.data, work?.approverId, work?.reviewerId]);

  const selectedReferences = useMemo(() => {
    return referenceOptions.filter((user) => referenceIds.includes(user.id));
  }, [referenceIds, referenceOptions]);

  const reviewerProfile = !work?.reviewerId
    ? undefined
    : (usersQuery.data ?? []).find((user) => user.id === work.reviewerId);

  const approverProfile = !work?.approverId
    ? undefined
    : (usersQuery.data ?? []).find((user) => user.id === work.approverId);

  const drafterProfile = useMemo(() => {
    if (work?.createdBy) {
      return (usersQuery.data ?? []).find((user) => user.id === work.createdBy);
    }

    return (usersQuery.data ?? []).find((user) => {
      return user.id === userId || user.name === displayName;
    });
  }, [displayName, userId, usersQuery.data, work?.createdBy]);

  const drafterDisplayName = useMemo(() => {
    if (work?.createdBy) {
      return (
        (drafterProfile?.name || '').trim() ||
        (work.createdBy || '').trim() ||
        '-'
      );
    }
    return (drafterProfile?.name || '').trim() || displayName || userId;
  }, [displayName, drafterProfile?.name, userId, work?.createdBy]);

  const documentFieldProfile = useMemo(() => {
    if (work?.createdBy) {
      return {
        userId: work.createdBy,
        displayName: (drafterProfile?.name || '').trim() || work.createdBy,
        department: (drafterProfile?.department || '').trim(),
      };
    }
    return currentUserProfile;
  }, [
    currentUserProfile,
    drafterProfile?.department,
    drafterProfile?.name,
    work?.createdBy,
  ]);

  const documentFieldValues = useMemo(() => {
    const parsedSavedDate = (work?.createdAt || '').trim();
    const parsedNow = parsedSavedDate
      ? new Date(parsedSavedDate.replace(' ', 'T'))
      : new Date();

    return resolveDocumentFieldValues({
      now: Number.isNaN(parsedNow.getTime()) ? new Date() : parsedNow,
      user: documentFieldProfile,
    });
  }, [documentFieldProfile, work?.createdAt]);

  const handleChangeEditor = (nextContent: JSONContent, nextHtml: string) => {
    void nextHtml;
    if (!workDetailQuery.isFetched) {
      return;
    }

    setHasUserEdited(true);
    setEditorContent(nextContent);
    setEditorHtml(nextHtml);
  };

  const isOwner = useMemo(() => {
    if (typeof work?.isOwner === 'boolean') {
      return work.isOwner;
    }

    // 미작성 상태 (기안서 없음): 백엔드가 담당자 확인했으니 편집 가능
    if (!work?.approvalId) {
      return true;
    }
    // 작성됨 상태 (기안서 있음): 기안 작성자만 편집 가능
    return isDocumentOwner(work.createdBy, currentUserProfile.userId);
  }, [currentUserProfile.userId, work?.approvalId, work?.createdBy]);
  const isReadOnly = useMemo(() => {
    if (typeof work?.readOnly === 'boolean') {
      return work.readOnly;
    }
    return !isOwner;
  }, [isOwner, work?.readOnly]);

  const canTempSave = useMemo(() => {
    if (typeof work?.canTempSave === 'boolean') {
      return work.canTempSave;
    }
    return isOwner;
  }, [isOwner, work?.canTempSave]);

  const canSubmit = useMemo(() => {
    if (typeof work?.canSubmit === 'boolean') {
      return work.canSubmit;
    }
    return isOwner;
  }, [isOwner, work?.canSubmit]);

  const canSubmitCancel = useMemo(() => {
    if (typeof work?.canSubmitCancel === 'boolean') {
      return work.canSubmitCancel;
    }
    return isOwner;
  }, [isOwner, work?.canSubmitCancel]);

  const canApprove = useMemo(() => {
    if (typeof work?.canApprove === 'boolean') {
      return work.canApprove;
    }
    return false;
  }, [work?.canApprove]);

  const canConfirm = useMemo(() => {
    if (typeof work?.canConfirm === 'boolean') {
      return work.canConfirm;
    }
    return false;
  }, [work?.canConfirm]);

  const approvalEventType = useMemo<
    'review_approve' | 'final_approve' | undefined
  >(() => {
    if (!canApprove) {
      return undefined;
    }

    const reviewerStatus = String(work?.reviewerAppStatus ?? '')
      .trim()
      .toLowerCase();
    if (reviewerStatus === 'approved') {
      return 'final_approve';
    }
    return 'review_approve';
  }, [canApprove, work?.reviewerAppStatus]);

  const canReject = useMemo(() => {
    return canApprove;
  }, [approvalEventType, canApprove]);

  const referenceEventType = useMemo<'reference_confirm' | undefined>(() => {
    if (!canConfirm) {
      return undefined;
    }
    return 'reference_confirm';
  }, [canConfirm]);

  const rejectEventType = useMemo<
    'review_return' | 'final_return' | undefined
  >(() => {
    if (!canReject) {
      return undefined;
    }

    return approvalEventType === 'final_approve'
      ? 'final_return'
      : 'review_return';
  }, [approvalEventType, canReject]);

  return {
    baseId,
    idType,
    tenantCode,
    userId,
    displayName,
    drafterDisplayName,
    title,
    setTitle,
    referenceIds,
    setReferenceIds,
    workDetailQuery: {
      isError: workDetailQuery.isError,
      isFetched: workDetailQuery.isFetched,
    },
    work,
    documentFieldValues,
    resolvedEditorContent,
    resolvedEditorHtml,
    handleChangeEditor,
    referenceOptions,
    selectedReferences,
    drafterProfile,
    reviewerProfile,
    approverProfile,
    isOwner,
    isReadOnly,
    canTempSave,
    canSubmit,
    canSubmitCancel,
    canApprove,
    canConfirm,
    canReject,
    approvalEventType,
    referenceEventType,
    rejectEventType,
  };
}
