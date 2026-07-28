import { mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';

function resolveAlignStyle(align: string): string {
  if (align === 'left') {
    return 'display:block;margin:0.75rem 0.75rem 0.75rem 0;';
  }

  if (align === 'right') {
    return 'display:block;margin:0.75rem 0 0.75rem auto;';
  }

  return 'display:block;margin:0.75rem auto;';
}

export const EditorImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') ?? '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width = String(HTMLAttributes.width ?? '100%');
    const align = String(HTMLAttributes.align ?? 'center');
    const inlineStyle = `${resolveAlignStyle(align)}width:${width};max-width:100%;height:auto;`;

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: inlineStyle,
      }),
    ];
  },
});
