import dayjs from 'dayjs';
import type { JSONContent } from '@tiptap/core';
import type { ApprovalRole } from '../types';

export const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function decodeHtmlEntities(value: string): string {
  if (!value) {
    return value;
  }

  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const next = current
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    if (next === current) {
      break;
    }
    current = next;
  }

  return current;
}

function isDocContent(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeDoc = value as { type?: unknown };
  return typeof maybeDoc.type === 'string';
}

export function parseTemplateJson(value: string | undefined): JSONContent {
  if (!value || value.trim().length === 0) {
    return EMPTY_DOC;
  }

  const candidates = [value, decodeHtmlEntities(value)];

  for (const candidate of candidates) {
    let current = candidate;

    for (let depth = 0; depth < 3; depth += 1) {
      try {
        const parsed = JSON.parse(current) as unknown;

        if (isDocContent(parsed)) {
          return parsed;
        }

        if (typeof parsed === 'string' && parsed.trim().length > 0) {
          current = parsed;
          continue;
        }
      } catch {
        // Try next candidate.
      }

      break;
    }
  }

  return EMPTY_DOC;
}

export function formatNow(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 업무 주기(work.cycle) 기준 보고일자. WEEK 는 그 주 월요일, MONTH 는 1일, YEAR 는 1월 1일, 그 외는 고른 날짜 그대로 (yyyy-MM-dd)
// 기존 -> WEEK 는 그 주 월요일, MONTH 는 1일, YEAR 는 1월 1일, 그 외는 고른 날짜 그대로
// 변경 -> QUARTER 는 분기 첫날, HALF 는 1월 1일 또는 7월 1일 추가
export function toCycleStartDate(cycle: string, date: string): string {
  const value = dayjs(date);
  if (!date || !value.isValid()) {
    return date;
  }
  if (cycle === 'WEEK') {
    return value.subtract((value.day() + 6) % 7, 'day').format('YYYY-MM-DD');
  }
  if (cycle === 'MONTH') {
    return value.startOf('month').format('YYYY-MM-DD');
  }
  if (cycle === 'YEAR') {
    return value.startOf('year').format('YYYY-MM-DD');
  }
  if (cycle === 'QUARTER') {
    return value.month(Math.floor(value.month() / 3) * 3).startOf('month').format('YYYY-MM-DD');
  }
  if (cycle === 'HALF') {
    return value.month(value.month() < 6 ? 0 : 6).startOf('month').format('YYYY-MM-DD');
  }
  return date;
}

export function renderApprovalStampLabel(role: ApprovalRole): string {
  return role === 'reviewer' ? '검토도장' : '승인도장';
}

export function canDeleteDraft(params: {
  isOwner: boolean;
  approvalStatusType?: string;
  draftNumber?: string;
  approvalId?: string;
}): boolean {
  const status = String(params.approvalStatusType ?? '').trim().toLowerCase();
  return (
      params.isOwner &&
      status === 'pre_apply' &&
      Boolean((params.draftNumber ?? '').trim()) &&
      Boolean((params.approvalId ?? '').trim())
  );
}