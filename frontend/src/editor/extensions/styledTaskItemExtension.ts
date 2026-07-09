import { mergeAttributes } from '@tiptap/core';
import TaskItem from '@tiptap/extension-task-item';

export const StyledTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-task-text-align') ||
          element.style.textAlign ||
          null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes.textAlign;
          if (!value || typeof value !== 'string') {
            return {};
          }

          return {
            'data-task-text-align': value,
            style: `text-align:${value}`,
          };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-task-font-size') ||
          element.style.fontSize ||
          null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes.fontSize;
          if (!value || typeof value !== 'string') {
            return {};
          }

          return {
            'data-task-font-size': value,
            style: `font-size:${value}`,
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-checked': node.attrs.checked,
      }),
      [
        'label',
        { contenteditable: 'false' },
        [
          'input',
          {
            type: 'checkbox',
            'aria-label': `Task item checkbox for ${node.textContent}`,
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
        ['span'],
      ],
      ['div', 0],
    ];
  },
});
