import type { DocumentFieldValues } from './documentFieldValues';

export function resolveDocumentFieldPreviewHtml(
  html: string,
  values: DocumentFieldValues,
): string {
  if (!html) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tokens = doc.querySelectorAll<HTMLElement>('[data-document-field]');

  tokens.forEach((token) => {
    const fieldKey = token.getAttribute('data-document-field-key');
    if (
      fieldKey !== 'createdAt' &&
      fieldKey !== 'department' &&
      fieldKey !== 'author'
    ) {
      return;
    }

    const mappedValue = values[fieldKey] || token.textContent || '';
    token.replaceWith(doc.createTextNode(mappedValue));
  });

  return doc.body.innerHTML;
}
