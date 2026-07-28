import { describe, expect, it } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import {
  resolveDocumentFieldSnapshotContent,
  resolveDocumentFieldSnapshotHtml,
} from '../editor/utils/documentFieldSnapshot';

describe('resolveDocumentFieldSnapshotContent', () => {
  it('replaces document field nodes with their resolved values before save', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'documentField', attrs: { fieldKey: 'author' } },
            { type: 'text', text: ' / ' },
            { type: 'documentField', attrs: { fieldKey: 'department' } },
          ],
        },
      ],
    };

    const result = resolveDocumentFieldSnapshotContent(content, {
      createdAt: '2026-07-10',
      author: '홍길동',
      department: '품질관리팀',
    });

    expect(result).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '홍길동' },
            { type: 'text', text: ' / ' },
            { type: 'text', text: '품질관리팀' },
          ],
        },
      ],
    });
  });
});

describe('resolveDocumentFieldSnapshotHtml', () => {
  it('replaces document field tokens with resolved values before save', () => {
    const html =
      '<p><span data-document-field="" data-document-field-key="author" data-document-field-label="작성자" class="document-field-token">문서필드 작성자</span></p>';

    const result = resolveDocumentFieldSnapshotHtml(html, {
      createdAt: '2026-07-10',
      department: '품질관리팀',
      author: '홍길동',
    });

    expect(result).toBe('<p>홍길동</p>');
  });
});
