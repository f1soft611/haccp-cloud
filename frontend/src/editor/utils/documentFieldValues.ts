export type DocumentFieldKey = 'createdAt' | 'department' | 'author';

export type DocumentFieldValues = Record<DocumentFieldKey, string>;

export type DocumentFieldContext = {
  now: Date;
  user: {
    userId: string;
    displayName?: string;
    department?: string;
  };
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

function formatDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function resolveDocumentFieldValues(
  context: DocumentFieldContext,
): DocumentFieldValues {
  return {
    createdAt: formatDate(context.now),
    author: normalizeText(context.user.displayName || context.user.userId),
    department: normalizeText(context.user.department),
  };
}
