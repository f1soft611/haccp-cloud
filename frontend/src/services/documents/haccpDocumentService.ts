import { apiClient } from '../api/apiClient';

export type HaccpDocumentItem = {
  id: string;
  approvalId: string;
  workType: string;
  workDivision: string;
  draftNumber: string;
  title: string;
  writer: string;
  status: '임시저장' | '결재중' | '승인' | '반송';
  draftedAt: string;
  updatedAt: string;
};

export type ListHaccpDocumentsResult = {
  items: HaccpDocumentItem[];
  totalCount: number;
  paginationInfo?: {
    currentPageNo?: number;
    recordCountPerPage?: number;
    totalRecordCount?: number;
  };
};

type RawHaccpDocumentItem = {
  draftingWorkCategoryId?: number | string | null;
  id?: number | string | null;
  electronicApprovalId?: number | string | null;
  electronic_approval_id?: number | string | null;
  categoryName?: string | null;
  categoryNm?: string | null;
  cataName?: string | null;
  divisionName?: string | null;
  codeName?: string | null;
  code_name?: string | null;
  eaExeId?: string | null;
  ea_exe_id?: string | null;
  title?: string | null;
  eaTitle?: string | null;
  ea_title?: string | null;
  createdBy?: string | number | null;
  created_by?: string | number | null;
  createdAt?: string | null;
  created_at?: string | null;
  latestStatusAt?: string | null;
  latest_status_at?: string | null;
  approvalStatusTypeName?: string | null;
  approval_status_type_name?: string | null;
};

type ResultEnvelope<T> = {
  result?: {
    resultList?: T[];
    totalCount?: number;
    paginationInfo?: {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    };
  };
};

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function normalizeStatus(value: unknown): HaccpDocumentItem['status'] {
  const normalized = normalizeText(value);
  if (normalized === '결재중') {
    return '결재중';
  }
  if (normalized === '승인') {
    return '승인';
  }
  if (normalized === '반송' || normalized === '반려') {
    return '반송';
  }
  return '임시저장';
}

function normalizeItem(raw: RawHaccpDocumentItem): HaccpDocumentItem {
  const approvalId = normalizeText(
    raw.electronicApprovalId ?? raw.electronic_approval_id,
  );
  const draftingWorkCategoryId = normalizeText(
    raw.id ?? raw.draftingWorkCategoryId,
  );
  const draftNumber = normalizeText(raw.eaExeId ?? raw.ea_exe_id);
  const latestStatusAt = normalizeText(
    raw.latestStatusAt ?? raw.latest_status_at,
  );

  // Document list rows must use a unique identity per approval document.
  const rowId =
    approvalId ||
    [draftingWorkCategoryId, draftNumber, latestStatusAt]
      .filter((value) => value.length > 0)
      .join('-');

  return {
    id: rowId,
    approvalId,
    workType: normalizeText(raw.categoryName ?? raw.categoryNm ?? raw.cataName),
    workDivision: normalizeText(
      raw.divisionName ?? raw.codeName ?? raw.code_name,
    ),
    draftNumber,
    title: normalizeText(raw.title ?? raw.eaTitle ?? raw.ea_title),
    writer: normalizeText(raw.createdBy ?? raw.created_by),
    status: normalizeStatus(
      raw.approvalStatusTypeName ?? raw.approval_status_type_name,
    ),
    draftedAt: normalizeText(raw.createdAt ?? raw.created_at),
    updatedAt: latestStatusAt,
  };
}

export async function listHaccpDocuments(params: {
  tenantCode: string;
  pageIndex: number;
  pageSize: number;
  workType?: string;
  workDivisionId?: string;
  workDivision?: string;
  draftNumber?: string;
  title?: string;
  writer?: string;
  participantType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ListHaccpDocumentsResult> {
  const { data } = await apiClient.get<
    RawHaccpDocumentItem[] | ResultEnvelope<RawHaccpDocumentItem>
  >('/v1/haccp-work/documents', {
    headers: { 'x-tenant-code': params.tenantCode },
    params: {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      workType: params.workType || undefined,
      workDivisionId: params.workDivisionId || undefined,
      workDivision: params.workDivision || undefined,
      draftNumber: params.draftNumber || undefined,
      title: params.title || undefined,
      writer: params.writer || undefined,
      participantType: params.participantType || undefined,
      status: params.status || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return {
    items: items.map(normalizeItem),
    totalCount: Array.isArray(data)
      ? items.length
      : (data?.result?.totalCount ?? 0),
    paginationInfo: Array.isArray(data)
      ? undefined
      : data?.result?.paginationInfo,
  };
}
