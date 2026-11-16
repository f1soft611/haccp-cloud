import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { createElement } from 'react';

export type DocumentFieldImageAttributes = {
  src?: string;
  alt?: string;
  width?: string;
  align?: string;
};

export const MAX_DOCUMENT_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
]);

type ImageFileCandidate = Pick<File, 'name' | 'type' | 'size'>;

export function validateDocumentImageFile(
  file: ImageFileCandidate | null,
): { ok: true } | { ok: false; message: string } {
  if (!file) {
    return { ok: false, message: '이미지 파일을 선택해 주세요.' };
  }

  if (file.size > MAX_DOCUMENT_IMAGE_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: '이미지는 5MB 이하 파일만 업로드할 수 있습니다.',
    };
  }

  const normalizedType = String(file.type || '')
    .toLowerCase()
    .trim();
  const isImageMimeType = normalizedType.startsWith('image/');

  const extension = String(file.name || '')
    .toLowerCase()
    .split('.')
    .pop();
  const isAllowedExtension =
    typeof extension === 'string' && ALLOWED_IMAGE_EXTENSIONS.has(extension);

  if (!isImageMimeType && !isAllowedExtension) {
    return {
      ok: false,
      message:
        '지원하지 않는 파일 형식입니다. png, jpg, jpeg, gif, webp, bmp, svg 파일만 사용할 수 있습니다.',
    };
  }

  return { ok: true };
}

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

  const insertImageFromFile = (file: File | null) => {
    if (!file) {
      window.alert('이미지 파일을 선택해 주세요.');
      return;
    }

    const validationResult = validateDocumentImageFile(file);
    if (!validationResult.ok) {
      window.alert(validationResult.message);
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

      const paragraphType = editor.schema.nodes.paragraph;
      const tr = editor.state.tr.replaceRangeWith(
        pos,
        pos + node.nodeSize,
        imageNode,
      );

      if (paragraphType) {
        const paragraphPos = pos + imageNode.nodeSize;
        tr.insert(paragraphPos, paragraphType.create());
        const selectionPos = Math.min(
          paragraphPos + 1,
          Math.max(1, tr.doc.content.size),
        );
        tr.setSelection(TextSelection.near(tr.doc.resolve(selectionPos), 1));
      }

      editor.view.dispatch(tr);
      editor.commands.focus();
    };

    reader.readAsDataURL(file);
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      insertImageFromFile(file);
      input.value = '';
    };
    input.click();
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
        minHeight: 40,
        padding: '0.5rem 0.75rem',
        border: '1px dashed #94a3b8',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        color: '#475569',
        cursor: 'pointer',
        fontSize: 13,
        width: 'fit-content',
        maxWidth: '100%',
      },
    },
    createElement(
      'span',
      null,
      src
        ? '이미지 삽입 완료'
        : '문서필드 이미지 · 클릭하여 이미지를 선택하세요.',
    ),
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
            .insertContent([
              {
                type: this.name,
                attrs,
              },
              {
                type: 'paragraph',
              },
            ])
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentFieldImageNodeView);
  },
});
