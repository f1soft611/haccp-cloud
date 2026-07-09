import type { JSONContent } from '@tiptap/core';

const EDITOR_STORAGE_KEY = 'haccp-base-editor-docs-v1';

type EditorStoragePayload = Record<string, JSONContent>;

function readStorage(): EditorStoragePayload {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EDITOR_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as EditorStoragePayload;
  } catch {
    return {};
  }
}

function writeStorage(payload: EditorStoragePayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredDocument(docId: string): JSONContent | null {
  if (!docId) {
    return null;
  }

  const payload = readStorage();
  return payload[docId] ?? null;
}

export function setStoredDocument(docId: string, content: JSONContent) {
  if (!docId) {
    return;
  }

  const payload = readStorage();
  writeStorage({
    ...payload,
    [docId]: content,
  });
}

export function hasVisibleContent(
  content: JSONContent | null | undefined,
): boolean {
  if (!content) {
    return false;
  }

  if (typeof content.text === 'string' && content.text.trim().length > 0) {
    return true;
  }

  if (!content.content || content.content.length === 0) {
    return false;
  }

  return content.content.some((child) => {
    if (!child) {
      return false;
    }

    if (
      child.type === 'horizontalRule' ||
      child.type === 'image' ||
      child.type === 'table' ||
      child.type === 'codeBlock' ||
      child.type === 'blockquote' ||
      child.type === 'taskList'
    ) {
      return true;
    }

    return hasVisibleContent(child);
  });
}
