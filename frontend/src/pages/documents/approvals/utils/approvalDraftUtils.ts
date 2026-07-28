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

export function renderApprovalStampLabel(role: ApprovalRole): string {
  return role === 'reviewer' ? '검토도장' : '승인도장';
}
