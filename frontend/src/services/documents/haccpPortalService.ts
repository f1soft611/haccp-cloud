import { apiClient } from '../api/apiClient';

export type HaccpPortalDocumentItem = {
  id: string;
  categoryName: string;
  divisionName: string;
  cycle: string;
  cycleName: string;
  assigneeSummary: string;
};

type RawHaccpPortalDocumentItem = {
  draftingWorkCategoryId?: number | string | null;
  drafting_work_category_id?: number | string | null;
  categoryName?: string | null;
  category_name?: string | null;
  divisionName?: string | null;
  division_name?: string | null;
  code_name?: string | null;
  cycle?: string | null;
  reg_term?: string | null;
  cycleName?: string | null;
  reg_term_nm?: string | null;
  assigneeSummary?: string | null;
  assignee_summary?: string | null;
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

function normalizeItem(
  raw: RawHaccpPortalDocumentItem,
): HaccpPortalDocumentItem {
  return {
    id: normalizeText(
      raw.draftingWorkCategoryId ?? raw.drafting_work_category_id,
    ),
    categoryName: normalizeText(raw.categoryName ?? raw.category_name),
    divisionName: normalizeText(
      raw.divisionName ?? raw.division_name ?? raw.code_name,
    ),
    // 기존 -> cycle(한글 이름) / 변경 -> cycle(공통코드) + cycleName(공통코드 이름, 없으면 코드)
    cycle: normalizeText(raw.cycle ?? raw.reg_term),
    cycleName:
        normalizeText(raw.cycleName ?? raw.reg_term_nm) ||
        normalizeText(raw.cycle ?? raw.reg_term),
    assigneeSummary: normalizeText(raw.assigneeSummary ?? raw.assignee_summary),
  };
}

export async function listHaccpPortalDocuments(params: {
  tenantCode: string;
}): Promise<HaccpPortalDocumentItem[]> {
  const { data } = await apiClient.get<
    RawHaccpPortalDocumentItem[] | ResultEnvelope<RawHaccpPortalDocumentItem>
  >('/v1/docs/portal', {
    headers: { 'x-tenant-code': params.tenantCode },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return items.map(normalizeItem);
}
