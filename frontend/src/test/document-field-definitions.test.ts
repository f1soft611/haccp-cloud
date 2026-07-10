import { describe, expect, it } from 'vitest';
import { getDocumentFieldDefinition } from '../editor/utils/documentFieldDefinitions';

describe('documentFieldDefinitions', () => {
  it('exposes a shared document field label with distinct field keys', () => {
    expect(getDocumentFieldDefinition('createdAt')).toEqual({
      fieldKey: 'createdAt',
      fieldLabel: '작성일자',
      groupLabel: '문서필드',
    });

    expect(getDocumentFieldDefinition('department')).toEqual({
      fieldKey: 'department',
      fieldLabel: '부서',
      groupLabel: '문서필드',
    });

    expect(getDocumentFieldDefinition('author')).toEqual({
      fieldKey: 'author',
      fieldLabel: '작성자',
      groupLabel: '문서필드',
    });
  });
});
