import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { createElement, useRef, type ChangeEvent } from 'react';

export type DocumentFieldImageAttributes = {
  src?: string;
  alt?: string;
  width?: string;
  align?: string;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentFieldImage: {
      insertDocumentFieldImage: (
        attrs?: DocumentFieldImageAttributes,
      ) => ReturnType;
    };
  }
}

export function createDefaultDocumentFieldImageAttributes(): DocumentFieldImageAttributes {
  return {
    src: '',
    alt: '문서필드 이미지',
    width: '100%',
    align: 'center',
  };
}

export function createDocumentFieldImageNode(
  attrs: DocumentFieldImageAttributes = {},
) {
  return {
    type: 'documentFieldImage',
    attrs: {
      ...createDefaultDocumentFieldImageAttributes(),
      ...attrs,
    },
  };
}

function DocumentFieldImageNodeView(props: NodeViewProps) {
  const { node, editor, getPos } = props;
  const attrs = (node.attrs ?? {}) as DocumentFieldImageAttributes;
  const src = String(attrs.src ?? '').trim();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextSrc = typeof reader.result === 'string' ? reader.result : '';
      if (!nextSrc) {
        return;
      }

      const pos = getPos();
      if (typeof pos !== 'number') {
        return;
      }

      const imageType = editor.schema.nodes.image;
      if (!imageType) {
        return;
      }

      const imageNode = imageType.create({
        src: nextSrc,
        alt: attrs.alt || '문서필드 이미지',
        width: attrs.width || '100%',
        align: attrs.align || 'center',
      });

      const tr = editor.state.tr.replaceRangeWith(
        pos,
        pos + node.nodeSize,
        imageNode,
      );
      editor.view.dispatch(tr);
      editor.commands.focus();
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return createElement(
    NodeViewWrapper,
    {
      as: 'div',
      className: 'document-field-image-placeholder',
      contentEditable: false,
      onClick: handleInsertImage,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        padding: '0.75rem 1rem',
        border: '1px dashed #94a3b8',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        color: '#475569',
        cursor: 'pointer',
        fontSize: 14,
        width: '100%',
      },
    },
    createElement(
      'span',
      null,
      src
        ? '이미지 삽입 완료'
        : '문서필드 이미지 · 클릭하면 로컬 이미지를 선택합니다',
    ),
    createElement('input', {
      ref: fileInputRef,
      type: 'file',
      accept: 'image/*',
      style: { display: 'none' },
      onChange: handleFileSelection,
    }),
  );
}

export const DocumentFieldImageExtension = Node.create({
  name: 'documentFieldImage',
  group: 'block',
  selectable: true,
  draggable: false,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: '문서필드 이미지',
      },
      width: {
        default: '100%',
      },
      align: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-document-field-image]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-document-field-image': '',
      }),
      '문서필드 이미지',
    ];
  },

  addCommands() {
    return {
      insertDocumentFieldImage:
        (attrs = createDefaultDocumentFieldImageAttributes()) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentFieldImageNodeView);
  },
});
