import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import type { DocumentFieldKey } from '../utils/documentFieldDefinitions';
import { getDocumentFieldDefinition } from '../utils/documentFieldDefinitions';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentField: {
      insertDocumentField: (fieldKey: DocumentFieldKey) => ReturnType;
    };
  }
}

export type DocumentFieldResolver = (fieldKey: DocumentFieldKey) => string;

type DocumentFieldOptions = {
  resolveFieldValue: DocumentFieldResolver;
};

function normalizeFieldKey(value: unknown): DocumentFieldKey {
  if (value === 'createdAt' || value === 'department' || value === 'author') {
    return value;
  }

  return 'author';
}

function DocumentFieldNodeView(props: NodeViewProps) {
  const { node } = props;
  const fieldKey = normalizeFieldKey(node.attrs.fieldKey);
  const definition = getDocumentFieldDefinition(fieldKey);

  return (
    <NodeViewWrapper
      as="span"
      className="document-field-token"
      contentEditable={false}
    >
      <span className="document-field-token__group">
        {definition.groupLabel}
      </span>
      <span className="document-field-token__label">
        {definition.fieldLabel}
      </span>
    </NodeViewWrapper>
  );
}

export const DocumentFieldExtension = Node.create<DocumentFieldOptions>({
  name: 'documentField',

  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  draggable: false,

  addOptions() {
    return {
      resolveFieldValue: (fieldKey: DocumentFieldKey) =>
        getDocumentFieldDefinition(fieldKey).fieldLabel,
    };
  },

  addAttributes() {
    return {
      fieldKey: {
        default: 'author',
        parseHTML: (element: HTMLElement) =>
          normalizeFieldKey(element.getAttribute('data-document-field-key')),
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes.fieldKey;
          if (
            value !== 'createdAt' &&
            value !== 'department' &&
            value !== 'author'
          ) {
            return {};
          }

          return {
            'data-document-field-key': value,
          };
        },
      },
      fieldLabel: {
        default: '작성자',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-document-field-label') || '작성자',
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes.fieldLabel;
          if (typeof value !== 'string' || value.trim().length === 0) {
            return {};
          }

          return {
            'data-document-field-label': value,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-document-field]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const fieldKey = normalizeFieldKey(node.attrs.fieldKey);
    const definition = getDocumentFieldDefinition(fieldKey);

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-document-field': '',
        'data-document-field-key': fieldKey,
        'data-document-field-label': definition.fieldLabel,
        class: 'document-field-token',
      }),
      `${definition.groupLabel} ${definition.fieldLabel}`,
    ];
  },

  addCommands() {
    return {
      insertDocumentField:
        (fieldKey: DocumentFieldKey) =>
        ({ chain }) => {
          const definition = getDocumentFieldDefinition(fieldKey);

          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                fieldKey,
                fieldLabel: definition.fieldLabel,
              },
            })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentFieldNodeView);
  },
});
