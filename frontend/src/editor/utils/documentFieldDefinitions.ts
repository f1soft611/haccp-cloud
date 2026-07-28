export type DocumentFieldKey = 'createdAt' | 'department' | 'author';

export type DocumentFieldDefinition = {
  fieldKey: DocumentFieldKey;
  fieldLabel: string;
  groupLabel: '문서필드';
};

const DOCUMENT_FIELD_DEFINITIONS: Record<
  DocumentFieldKey,
  DocumentFieldDefinition
> = {
  createdAt: {
    fieldKey: 'createdAt',
    fieldLabel: '작성일자',
    groupLabel: '문서필드',
  },
  department: {
    fieldKey: 'department',
    fieldLabel: '부서',
    groupLabel: '문서필드',
  },
  author: {
    fieldKey: 'author',
    fieldLabel: '작성자',
    groupLabel: '문서필드',
  },
};

export function getDocumentFieldDefinition(
  fieldKey: DocumentFieldKey,
): DocumentFieldDefinition {
  return DOCUMENT_FIELD_DEFINITIONS[fieldKey];
}

export function listDocumentFieldDefinitions(): DocumentFieldDefinition[] {
  return Object.values(DOCUMENT_FIELD_DEFINITIONS);
}
