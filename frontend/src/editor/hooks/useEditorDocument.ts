import { useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import {
  getStoredDocument,
  hasVisibleContent,
  setStoredDocument,
} from '../utils/documentStorage';

type UseEditorDocumentOptions = {
  docId: string;
};

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

export function useEditorDocument(options: UseEditorDocumentOptions) {
  const { docId } = options;

  const [content, setContent] = useState<JSONContent>(() => {
    return getStoredDocument(docId) ?? EMPTY_DOC;
  });

  const canEdit = useMemo(() => docId.trim().length > 0, [docId]);

  const saveDocument = (nextContent: JSONContent) => {
    if (!canEdit) {
      return;
    }

    setStoredDocument(docId, nextContent);
  };

  const isCreated = useMemo(() => hasVisibleContent(content), [content]);

  return {
    content,
    setContent,
    saveDocument,
    isCreated,
    canEdit,
  };
}
