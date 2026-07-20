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
      userId,
      displayName: fromUsers?.name || displayName,
      department: fromUsers?.department || departmentName || '',
    };
  }, [departmentName, displayName, userId, usersQuery.data]);

  const documentFieldValues = useMemo(() => {
    return resolveDocumentFieldValues({
      now: new Date(),
      user: currentUserProfile,
    });
  }, [currentUserProfile]);

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

  const drafterProfile = (usersQuery.data ?? []).find((user) => {
    if (work?.createdBy && user.id === work.createdBy) {
      return true;
    }
    return user.id === userId || user.name === displayName;
  });

  const drafterDisplayName =
    (drafterProfile?.name || '').trim() ||
    (work?.createdBy || '').trim() ||
    displayName ||
    userId;

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
    // 미작성 상태 (기안서 없음): 백엔드가 담당자 확인했으니 편집 가능
    if (!work?.electronicApprovalId) {
      return true;
    }
    // 작성됨 상태 (기안서 있음): 기안 작성자만 편집 가능
    return isDocumentOwner(work.createdBy, userId);
  }, [work?.electronicApprovalId, work?.createdBy, userId]);
  const isReadOnly = !isOwner;

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
  };
}
