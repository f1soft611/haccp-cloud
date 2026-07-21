import type { JSONContent } from '@tiptap/core';
import type { DocumentFieldValues } from './documentFieldValues';
import { resolveDocumentFieldPreviewHtml } from './documentFieldHtml';

function resolveNodeText(
  node: JSONContent,
  values: DocumentFieldValues,
): JSONContent {
  if (!node || typeof node !== 'object') {
    return node;
  }

  if (node.type === 'documentField') {
    const fieldKey = node.attrs?.fieldKey as string | undefined;
    const resolvedValue =
      fieldKey === 'createdAt' ||
      fieldKey === 'department' ||
      fieldKey === 'author'
        ? values[fieldKey as keyof DocumentFieldValues]
        : '';

    return {
      type: 'text',
      text: resolvedValue || node.attrs?.fieldLabel || '',
    };
  }

  if (!Array.isArray(node.content)) {
    return node;
  }

  return {
    ...node,
    content: node.content.map((child) => resolveNodeText(child, values)),
  };
}

export function resolveDocumentFieldSnapshotContent(
  content: JSONContent,
  values: DocumentFieldValues,
): JSONContent {
  return resolveNodeText(content, values);
}

export function resolveDocumentFieldSnapshotHtml(
  html: string,
  values: DocumentFieldValues,
): string {
  return resolveDocumentFieldPreviewHtml(html, values);
}
