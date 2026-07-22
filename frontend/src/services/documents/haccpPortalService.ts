import { apiClient } from '../api/apiClient';

export type HaccpPortalDocumentItem = {
  id: string;
  categoryName: string;
  divisionName: string;
  cycle: string;
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
    cycle: normalizeText(raw.cycle ?? raw.reg_term),
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
