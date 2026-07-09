import { apiClient } from '../api/apiClient';

export type HaccpBaseWorkItem = {
  id: string;
  tenantCode: string;
  categoryGroupId: string;
  categoryCode: string;
  categoryName: string;
  divisionCode: string;
  divisionName: string;
  cycle: string;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  owner?: string;
  assigneeSummary?: string;
  assigneeIds: string[];
  reviewerId?: string;
  reviewerName?: string;
  approverId?: string;
  approverName?: string;
  assigneeMapped: boolean;
  templateJson?: string;
  templateHtml?: string;
};

type RawHaccpBaseWorkItem = {
  draftingWorkCategoryId?: number | string | null;
  id?: number | string | null;
  tenantCode?: string | null;
  categoryGroupId?: number | string | null;
  draftingWorkCategoryGroupId?: number | string | null;
  categoryCode?: string | null;
  cataCode?: string | null;
  categoryName?: string | null;
  categoryNm?: string | null;
  divisionCode?: string | null;
  cataTypeCode?: string | null;
  divisionName?: string | null;
  codeName?: string | null;
  cycle?: string | null;
  regTerm?: string | null;
  active?: boolean | string | null;
  useAt?: string | null;
  createdBy?: string | number | null;
  createdAt?: string | null;
  owner?: string | null;
  assigneeSummary?: string | null;
  assigneeIdsCsv?: string | null;
  reviewerId?: number | string | null;
  reviewerName?: string | null;
  approverId?: number | string | null;
  approverName?: string | null;
  assigneeMapped?: boolean | string | null;
  templateJson?: string | null;
  templateHtml?: string | null;
  template_json?: string | null;
  template_html?: string | null;
};

type ResultEnvelope<T> = {
  result?: {
    resultList?: T[];
    item?: T;
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

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = normalizeText(value).toUpperCase();
  return normalized === 'Y' || normalized === 'TRUE' || normalized === '1';
}

function normalizeStringArrayFromCsv(value: unknown): string[] {
  const csv = normalizeText(value);
  if (!csv) {
    return [];
  }

  return csv
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeItem(raw: RawHaccpBaseWorkItem): HaccpBaseWorkItem {
  return {
    id: normalizeText(raw.id ?? raw.draftingWorkCategoryId),
    tenantCode: normalizeText(raw.tenantCode),
    categoryGroupId: normalizeText(
      raw.categoryGroupId ?? raw.draftingWorkCategoryGroupId,
    ),
    categoryCode: normalizeText(raw.categoryCode ?? raw.cataCode),
    categoryName: normalizeText(raw.categoryName ?? raw.categoryNm),
    divisionCode: normalizeText(raw.divisionCode ?? raw.cataTypeCode),
    divisionName: normalizeText(raw.divisionName ?? raw.codeName),
    cycle: normalizeText(raw.cycle ?? raw.regTerm),
    active: normalizeBoolean(raw.active ?? raw.useAt),
    createdBy: normalizeText(raw.createdBy),
    createdAt: normalizeText(raw.createdAt),
    owner: normalizeText(raw.owner),
    assigneeSummary: normalizeText(raw.assigneeSummary),
    assigneeIds: normalizeStringArrayFromCsv(raw.assigneeIdsCsv),
    reviewerId: normalizeText(raw.reviewerId),
    reviewerName: normalizeText(raw.reviewerName),
    approverId: normalizeText(raw.approverId),
    approverName: normalizeText(raw.approverName),
    assigneeMapped: normalizeBoolean(raw.assigneeMapped),
    templateJson: normalizeText(raw.templateJson ?? raw.template_json),
    templateHtml: normalizeText(raw.templateHtml ?? raw.template_html),
  };
}

export async function listHaccpBaseWorks(params: {
  tenantCode: string;
  active?: 'Y' | 'N';
}): Promise<HaccpBaseWorkItem[]> {
  const { data } = await apiClient.get<
    RawHaccpBaseWorkItem[] | ResultEnvelope<RawHaccpBaseWorkItem>
  >('/v1/haccp-base/works', {
    headers: { 'x-tenant-code': params.tenantCode },
    params: { active: params.active || undefined },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return items.map(normalizeItem);
}

export async function createHaccpBaseWork(payload: {
  tenantCode: string;
  categoryGroupId: string;
  divisionCode: string;
  divisionName: string;
  cycle: string;
  active: boolean;
  reviewerId?: string;
  approverId?: string;
  assigneeIds?: string[];
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.post<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(
    '/v1/haccp-base/works',
    {
      categoryGroupId: Number(payload.categoryGroupId),
      divisionCode: payload.divisionCode,
      divisionName: payload.divisionName,
      cycle: payload.cycle,
      active: payload.active,
      reviewerId: payload.reviewerId ? Number(payload.reviewerId) : null,
      approverId: payload.approverId ? Number(payload.approverId) : null,
      assigneeIds: payload.assigneeIds ?? [],
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );

  const item = Array.isArray(data)
    ? data[0]
    : ((data as ResultEnvelope<RawHaccpBaseWorkItem>)?.result?.item ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function updateHaccpBaseWork(payload: {
  tenantCode: string;
  id: string;
  categoryGroupId: string;
  divisionCode: string;
  divisionName: string;
  cycle: string;
  active: boolean;
  reviewerId?: string;
  approverId?: string;
  assigneeIds?: string[];
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.put<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(
    `/v1/haccp-base/works/${payload.id}`,
    {
      categoryGroupId: Number(payload.categoryGroupId),
      divisionCode: payload.divisionCode,
      divisionName: payload.divisionName,
      cycle: payload.cycle,
      active: payload.active,
      reviewerId: payload.reviewerId ? Number(payload.reviewerId) : null,
      approverId: payload.approverId ? Number(payload.approverId) : null,
      assigneeIds: payload.assigneeIds ?? [],
    },
    { headers: { 'x-tenant-code': payload.tenantCode } },
  );

  const item = Array.isArray(data)
    ? data[0]
    : ((data as ResultEnvelope<RawHaccpBaseWorkItem>)?.result?.item ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function saveHaccpBaseWorkTemplate(payload: {
  tenantCode: string;
  id: string;
  templateJson: string;
  templateHtml: string;
}): Promise<void> {
  await apiClient.put(
    `/v1/haccp-base/works/${payload.id}/template`,
    {
      templateJson: payload.templateJson,
      templateHtml: payload.templateHtml,
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );
}
