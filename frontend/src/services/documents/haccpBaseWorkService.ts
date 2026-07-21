import { apiClient } from '../api/apiClient';

export type HaccpBaseWorkItem = {
  id: string;
  approvalId?: string;
  draftNumber?: string;
  title?: string;
  tenantCode: string;
  categoryGroupId: string;
  categoryCode: string;
  categoryName: string;
  categorySortOrder: number;
  divisionCode: string;
  divisionName: string;
  cycle: string;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  owner?: string;
  assigneeSummary?: string;
  assigneeIds: string[];
  referenceIds: string[];
  reviewerId?: string;
  reviewerName?: string;
  approverId?: string;
  approverName?: string;
  assigneeMapped: boolean;
  templateJson?: string;
  templateHtml?: string;
  hasDocument: boolean;
  todoStatus?: 'DRAFT' | 'IN_PROGRESS' | 'ACTIVE';
  approvalStatusType?: string;
  approvalStatusTypeName?: string;
  latestStatusAt?: string;
  drafterAppStatus?: string;
  reviewerAppStatus?: string;
  approverAppStatus?: string;
  isOwner?: boolean;
  isActorTurn?: boolean;
  readOnly?: boolean;
  canTempSave?: boolean;
  canSubmit?: boolean;
  canSubmitCancel?: boolean;
  canApprove?: boolean;
  canConfirm?: boolean;
  writtenInCycle?: boolean;
  pendingApprovalAlert?: boolean;
  pendingArrivalAt?: string;
};

export type HaccpApprovalCommentItem = {
  id: string;
  parentCommentId?: string;
  author: string;
  authorProfileImage?: string;
  text: string;
  createdAt: string;
  answerTypeName: string;
  isSystem: boolean;
};

type RawHaccpBaseWorkItem = {
  draftingWorkCategoryId?: number | string | null;
  id?: number | string | null;
  approvalId?: number | string | null;
  electronicApprovalId?: number | string | null;
  electronic_approval_id?: number | string | null;
  eaExeId?: string | null;
  ea_exe_id?: string | null;
  title?: string | null;
  eaTitle?: string | null;
  ea_title?: string | null;
  tenantCode?: string | null;
  categoryGroupId?: number | string | null;
  draftingWorkCategoryGroupId?: number | string | null;
  categoryCode?: string | null;
  cataCode?: string | null;
  categoryName?: string | null;
  categoryNm?: string | null;
  categorySortOrder?: number | string | null;
  category_sort_order?: number | string | null;
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
  referenceIdsCsv?: string | null;
  reference_ids_csv?: string | null;
  reviewerId?: number | string | null;
  reviewerName?: string | null;
  approverId?: number | string | null;
  approverName?: string | null;
  assigneeMapped?: boolean | string | null;
  templateJson?: unknown;
  templateHtml?: string | null;
  template_json?: unknown;
  template_html?: string | null;
  hasDocument?: boolean | string | null;
  has_document?: boolean | string | null;
  todoStatus?: string | null;
  todo_status?: string | null;
  approvalStatusType?: string | null;
  approval_status_type?: string | null;
  approvalStatusTypeName?: string | null;
  approval_status_type_name?: string | null;
  latestStatusAt?: string | null;
  latest_status_at?: string | null;
  drafterAppStatus?: string | null;
  drafter_app_status?: string | null;
  reviewerAppStatus?: string | null;
  reviewer_app_status?: string | null;
  approverAppStatus?: string | null;
  approver_app_status?: string | null;
  isOwner?: boolean | string | null;
  is_owner?: boolean | string | null;
  isActorTurn?: boolean | string | null;
  is_actor_turn?: boolean | string | null;
  readOnly?: boolean | string | null;
  read_only?: boolean | string | null;
  canTempSave?: boolean | string | null;
  can_temp_save?: boolean | string | null;
  canSubmit?: boolean | string | null;
  can_submit?: boolean | string | null;
  canSubmitCancel?: boolean | string | null;
  can_submit_cancel?: boolean | string | null;
  canApprove?: boolean | string | null;
  can_approve?: boolean | string | null;
  canConfirm?: boolean | string | null;
  can_confirm?: boolean | string | null;
  writtenInCycle?: boolean | string | null;
  written_in_cycle?: boolean | string | null;
  pendingApprovalAlert?: boolean | string | null;
  pending_approval_alert?: boolean | string | null;
  pendingArrivalAt?: string | null;
  pending_arrival_at?: string | null;
};

type ResultEnvelope<T> = {
  result?: {
    resultList?: T[];
    item?: T;
    message?: string;
  };
};

type RawHaccpApprovalCommentItem = {
  commentId?: number | string | null;
  commentid?: number | string | null;
  parentCommentId?: number | string | null;
  parentcommentid?: number | string | null;
  parent_history_id?: number | string | null;
  actorName?: string | null;
  actorname?: string | null;
  actorProfileImage?: string | null;
  actorprofileimage?: string | null;
  actor_profile_image?: string | null;
  text?: string | null;
  createdAt?: string | null;
  createdat?: string | null;
  created_at?: string | null;
  answerAt?: string | null;
  answerat?: string | null;
  answer_at?: string | null;
  answerTypeName?: string | null;
  answertypename?: string | null;
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

function normalizeTemplateJson(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return String(value).trim();
}

function normalizeTodoStatus(
  value: unknown,
): 'DRAFT' | 'IN_PROGRESS' | 'ACTIVE' {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'ACTIVE';
  }
  if (normalized === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }
  return 'DRAFT';
}

function normalizeApprovalCommentItem(
  raw: RawHaccpApprovalCommentItem,
): HaccpApprovalCommentItem {
  const answerTypeName = normalizeText(
    raw.answerTypeName ?? raw.answertypename,
  );
  const createdAt = normalizeText(
    raw.createdAt ??
      raw.createdat ??
      raw.created_at ??
      raw.answerAt ??
      raw.answerat ??
      raw.answer_at,
  );
  return {
    id: normalizeText(raw.commentId ?? raw.commentid),
    parentCommentId: normalizeText(
      raw.parentCommentId ?? raw.parentcommentid ?? raw.parent_history_id,
    ),
    author: normalizeText(raw.actorName ?? raw.actorname) || '시스템',
    authorProfileImage:
      normalizeText(
        raw.actorProfileImage ??
          raw.actorprofileimage ??
          raw.actor_profile_image,
      ) || undefined,
    text: normalizeText(raw.text),
    createdAt,
    answerTypeName,
    isSystem: answerTypeName.toUpperCase() === 'SYSTEM',
  };
}

function normalizeItem(raw: RawHaccpBaseWorkItem): HaccpBaseWorkItem {
  return {
    id: normalizeText(raw.id ?? raw.draftingWorkCategoryId),
    approvalId: normalizeText(
      raw.approvalId ?? raw.electronicApprovalId ?? raw.electronic_approval_id,
    ),
    draftNumber: normalizeText(raw.eaExeId ?? raw.ea_exe_id),
    title: normalizeText(raw.title ?? raw.eaTitle ?? raw.ea_title),
    tenantCode: normalizeText(raw.tenantCode),
    categoryGroupId: normalizeText(
      raw.categoryGroupId ?? raw.draftingWorkCategoryGroupId,
    ),
    categoryCode: normalizeText(raw.categoryCode ?? raw.cataCode),
    categoryName: normalizeText(raw.categoryName ?? raw.categoryNm),
    categorySortOrder: Number(
      raw.categorySortOrder ?? raw.category_sort_order ?? 0,
    ),
    divisionCode: normalizeText(raw.divisionCode ?? raw.cataTypeCode),
    divisionName: normalizeText(raw.divisionName ?? raw.codeName),
    cycle: normalizeText(raw.cycle ?? raw.regTerm),
    active: normalizeBoolean(raw.active ?? raw.useAt),
    createdBy: normalizeText(raw.createdBy),
    createdAt: normalizeText(raw.createdAt),
    owner: normalizeText(raw.owner),
    assigneeSummary: normalizeText(raw.assigneeSummary),
    assigneeIds: normalizeStringArrayFromCsv(raw.assigneeIdsCsv),
    referenceIds: normalizeStringArrayFromCsv(
      raw.referenceIdsCsv ?? raw.reference_ids_csv,
    ),
    reviewerId: normalizeText(raw.reviewerId),
    reviewerName: normalizeText(raw.reviewerName),
    approverId: normalizeText(raw.approverId),
    approverName: normalizeText(raw.approverName),
    assigneeMapped: normalizeBoolean(raw.assigneeMapped),
    templateJson: normalizeTemplateJson(raw.templateJson ?? raw.template_json),
    templateHtml: normalizeText(raw.templateHtml ?? raw.template_html),
    hasDocument: normalizeBoolean(raw.hasDocument ?? raw.has_document),
    todoStatus: normalizeTodoStatus(raw.todoStatus ?? raw.todo_status),
    approvalStatusType: normalizeText(
      raw.approvalStatusType ?? raw.approval_status_type,
    ),
    approvalStatusTypeName: normalizeText(
      raw.approvalStatusTypeName ?? raw.approval_status_type_name,
    ),
    latestStatusAt: normalizeText(raw.latestStatusAt ?? raw.latest_status_at),
    drafterAppStatus: normalizeText(
      raw.drafterAppStatus ?? raw.drafter_app_status,
    ),
    reviewerAppStatus: normalizeText(
      raw.reviewerAppStatus ?? raw.reviewer_app_status,
    ),
    approverAppStatus: normalizeText(
      raw.approverAppStatus ?? raw.approver_app_status,
    ),
    isOwner: normalizeBoolean(raw.isOwner ?? raw.is_owner),
    isActorTurn: normalizeBoolean(raw.isActorTurn ?? raw.is_actor_turn),
    readOnly: normalizeBoolean(raw.readOnly ?? raw.read_only),
    canTempSave: normalizeBoolean(raw.canTempSave ?? raw.can_temp_save),
    canSubmit: normalizeBoolean(raw.canSubmit ?? raw.can_submit),
    canSubmitCancel: normalizeBoolean(
      raw.canSubmitCancel ?? raw.can_submit_cancel,
    ),
    canApprove: normalizeBoolean(raw.canApprove ?? raw.can_approve),
    canConfirm: normalizeBoolean(raw.canConfirm ?? raw.can_confirm),
    writtenInCycle: normalizeBoolean(
      raw.writtenInCycle ?? raw.written_in_cycle,
    ),
    pendingApprovalAlert: normalizeBoolean(
      raw.pendingApprovalAlert ?? raw.pending_approval_alert,
    ),
    pendingArrivalAt: normalizeText(
      raw.pendingArrivalAt ?? raw.pending_arrival_at,
    ),
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

export async function listHaccpWorkTodos(params: {
  tenantCode: string;
}): Promise<HaccpBaseWorkItem[]> {
  const { data } = await apiClient.get<
    RawHaccpBaseWorkItem[] | ResultEnvelope<RawHaccpBaseWorkItem>
  >('/v1/dashboard/todos', {
    headers: { 'x-tenant-code': params.tenantCode },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return items.map(normalizeItem);
}

export async function listHaccpWorkApprovalAlerts(params: {
  tenantCode: string;
}): Promise<HaccpBaseWorkItem[]> {
  const { data } = await apiClient.get<
    RawHaccpBaseWorkItem[] | ResultEnvelope<RawHaccpBaseWorkItem>
  >('/v1/dashboard/approval-alerts', {
    headers: { 'x-tenant-code': params.tenantCode },
  });

  const items = Array.isArray(data) ? data : (data?.result?.resultList ?? []);
  return items.map(normalizeItem);
}

export async function getHaccpWorkDraftTemplate(params: {
  tenantCode: string;
  id: string;
  idType?: 'work' | 'approval';
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.get<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(`/v1/haccp-work/drafts/${params.id}/template`, {
    headers: { 'x-tenant-code': params.tenantCode },
    params: {
      idType: params.idType || 'work',
    },
  });

  const envelope = data as ResultEnvelope<RawHaccpBaseWorkItem>;
  const item = Array.isArray(data)
    ? data[0]
    : (envelope?.result?.item ??
      envelope?.result?.resultList?.[0] ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function getHaccpBaseWorkById(params: {
  tenantCode: string;
  id: string;
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.get<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(`/v1/haccp-base/works/${params.id}`, {
    headers: { 'x-tenant-code': params.tenantCode },
  });

  const envelope = data as ResultEnvelope<RawHaccpBaseWorkItem>;
  const item = Array.isArray(data)
    ? data[0]
    : (envelope?.result?.item ??
      envelope?.result?.resultList?.[0] ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
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
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.put<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(
    `/v1/haccp-base/works/${payload.id}/template`,
    {
      templateJson: payload.templateJson,
      templateHtml: payload.templateHtml,
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );

  const envelope = data as ResultEnvelope<RawHaccpBaseWorkItem>;
  const item = Array.isArray(data)
    ? data[0]
    : (envelope?.result?.item ??
      envelope?.result?.resultList?.[0] ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function saveHaccpWorkTempDraft(payload: {
  tenantCode: string;
  id: string;
  title?: string;
  templateJson: string;
  templateHtml: string;
  referenceIds?: string[];
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.post<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(
    `/v1/haccp-work/drafts/${payload.id}/temp-save`,
    {
      title: payload.title,
      templateJson: payload.templateJson,
      templateHtml: payload.templateHtml,
      referenceIds: payload.referenceIds ?? [],
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );

  const envelope = data as ResultEnvelope<RawHaccpBaseWorkItem>;
  const item = Array.isArray(data)
    ? data[0]
    : (envelope?.result?.item ??
      envelope?.result?.resultList?.[0] ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function submitHaccpWorkDraft(payload: {
  tenantCode: string;
  id: string;
  title: string;
  templateJson: string;
  templateHtml: string;
  submitComment?: string;
  referenceIds?: string[];
}): Promise<{ message: string; approvalId?: string }> {
  const { data } = await apiClient.post<
    | { message?: string; item?: { approvalId?: string | number } }
    | ResultEnvelope<{
        message?: string;
        item?: { approvalId?: string | number };
      }>
  >(
    `/v1/haccp-work/drafts/${payload.id}/submit`,
    {
      title: payload.title,
      templateJson: payload.templateJson,
      templateHtml: payload.templateHtml,
      submitComment: payload.submitComment,
      referenceIds: payload.referenceIds ?? [],
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );

  const envelope = data as ResultEnvelope<{
    message?: string;
    item?: { approvalId?: string | number };
  }>;
  const directMessage = (
    data as { message?: string; item?: { approvalId?: string | number } }
  )?.message;
  const nestedMessage = envelope?.result?.message;
  const envelopeResult = (envelope?.result ?? {}) as {
    item?: { approvalId?: string | number };
    approvalId?: string | number;
  };
  const approvalIdRaw =
    envelopeResult.item?.approvalId ??
    envelopeResult.approvalId ??
    (data as { message?: string; item?: { approvalId?: string | number } })
      ?.item?.approvalId;

  return {
    message:
      normalizeText(directMessage ?? nestedMessage) ||
      '결재신청이 완료되었습니다.',
    approvalId: normalizeText(approvalIdRaw),
  };
}

export async function updateHaccpWorkApprovalStatus(payload: {
  tenantCode: string;
  approvalId: string;
  eventType:
    | 'review_approve'
    | 'review_return'
    | 'final_approve'
    | 'final_return'
    | 'reference_confirm'
    | 'submit_cancel';
  comment?: string;
}): Promise<HaccpBaseWorkItem> {
  const { data } = await apiClient.post<
    RawHaccpBaseWorkItem | ResultEnvelope<RawHaccpBaseWorkItem>
  >(
    `/v1/haccp-work/approvals/${payload.approvalId}/status`,
    {
      eventType: payload.eventType,
      comment: payload.comment,
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );

  const envelope = data as ResultEnvelope<RawHaccpBaseWorkItem>;
  const item = Array.isArray(data)
    ? data[0]
    : (envelope?.result?.item ??
      envelope?.result?.resultList?.[0] ??
      (data as RawHaccpBaseWorkItem));

  return normalizeItem(item ?? {});
}

export async function listHaccpWorkApprovalComments(payload: {
  tenantCode: string;
  approvalId: string;
}): Promise<HaccpApprovalCommentItem[]> {
  const { data } = await apiClient.get<
    RawHaccpApprovalCommentItem[] | ResultEnvelope<RawHaccpApprovalCommentItem>
  >(`/v1/haccp-work/approvals/${payload.approvalId}/comments`, {
    headers: { 'x-tenant-code': payload.tenantCode },
  });

  const envelope = data as ResultEnvelope<RawHaccpApprovalCommentItem>;
  const list = Array.isArray(data)
    ? data
    : (envelope?.result?.resultList ?? []);

  return list.map((item) => normalizeApprovalCommentItem(item ?? {}));
}

export async function createHaccpWorkApprovalComment(payload: {
  tenantCode: string;
  approvalId: string;
  comment: string;
  parentCommentId?: string;
}): Promise<void> {
  const trimmedParentCommentId = normalizeText(payload.parentCommentId);
  await apiClient.post(
    `/v1/haccp-work/approvals/${payload.approvalId}/comments`,
    {
      comment: payload.comment,
      parentCommentId: trimmedParentCommentId || undefined,
    },
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );
}
