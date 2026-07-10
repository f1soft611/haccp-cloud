import { describe, expect, it } from 'vitest';
import { resolveDocumentFieldPreviewHtml } from '../editor/utils/documentFieldHtml';

describe('resolveDocumentFieldPreviewHtml', () => {
  it('replaces document field tokens with mapped preview values', () => {
    const html =
      '<p><span data-document-field="" data-document-field-key="author" data-document-field-label="작성자" class="document-field-token">문서필드 작성자</span></p>';

    const result = resolveDocumentFieldPreviewHtml(html, {
      createdAt: '2026-07-10',
      department: '품질관리팀',
      author: '홍길동',
    });

    expect(result).toBe('<p>홍길동</p>');
  });
});
