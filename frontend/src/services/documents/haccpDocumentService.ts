import { apiClient } from '../api/apiClient';

export type HaccpDocumentItem = {
  id: string;
  approvalId: string;
  workType: string;
  draftNumber: string;
  title: string;
  writer: string;
  status: '임시저장' | '결재중' | '승인' | '반송';
  draftedAt: string;
  updatedAt: string;
};

type RawHaccpDocumentItem = {
  draftingWorkCategoryId?: number | string | null;
  id?: number | string | null;
  electronicApprovalId?: number | string | null;
  electronic_approval_id?: number | string | null;
  categoryName?: string | null;
  categoryNm?: string | null;
  cataName?: string | null;
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
  return {
    id: normalizeText(raw.id ?? raw.draftingWorkCategoryId),
    approvalId: normalizeText(
      raw.electronicApprovalId ?? raw.electronic_approval_id,
    ),
    workType: normalizeText(raw.categoryName ?? raw.categoryNm ?? raw.cataName),
    draftNumber: normalizeText(raw.eaExeId ?? raw.ea_exe_id),
    title: normalizeText(raw.title ?? raw.eaTitle ?? raw.ea_title),
    writer: normalizeText(raw.createdBy ?? raw.created_by),
    status: normalizeStatus(
      raw.approvalStatusTypeName ?? raw.approval_status_type_name,
    ),
    draftedAt: normalizeText(raw.createdAt ?? raw.created_at),
    updatedAt: normalizeText(raw.latestStatusAt ?? raw.latest_status_at),
  };
}

export async function listHaccpDocuments(params: {
  tenantCode: string;
  workType?: string;
  draftNumber?: string;
  title?: string;
  writer?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<HaccpDocumentItem[]> {
  const { data } = await apiClient.get<
    RawHaccpDocumentItem[] | ResultEnvelope<RawHaccpDocumentItem>
  >('/v1/haccp-work/documents', {
    headers: { 'x-tenant-code': params.tenantCode },
    params: {
      workType: params.workType || undefined,
      draftNumber: params.draftNumber || undefined,
      title: params.title || undefined,
      writer: params.writer || undefined,
      status: params.status || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return items.map(normalizeItem);
}
