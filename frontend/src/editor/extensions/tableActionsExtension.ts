import { Extension } from '@tiptap/core';

export const TableActionsExtension = Extension.create({
  name: 'table-actions',

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-h': () => this.editor.chain().focus().toggleHeaderRow().run(),
    };
  },
});
