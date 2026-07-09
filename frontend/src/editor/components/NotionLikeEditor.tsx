import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { useEffect, useRef } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { createBaseExtensions } from '../extensions/baseExtensions';
import { SlashCommandExtension } from '../extensions/slashCommandExtension';
import { TableActionsExtension } from '../extensions/tableActionsExtension';
import { EditorToolbar } from '../menus/EditorToolbar';
import { EditorBubbleMenu } from '../menus/EditorBubbleMenu';
import { TableContextMenu } from '../menus/TableContextMenu';
import { useEditorContextMenu } from '../hooks/useEditorContextMenu';
import { useEditorImageUpload } from '../hooks/useEditorImageUpload';
import './editor.css';

type NotionLikeEditorProps = {
  content: JSONContent;
  editable?: boolean;
  onChange: (content: JSONContent) => void;
};

export function NotionLikeEditor(props: NotionLikeEditorProps) {
  const { content, editable = true, onChange } = props;
  const theme = useTheme();

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      ...createBaseExtensions(),
      TableActionsExtension,
      SlashCommandExtension,
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextJson = JSON.stringify(content);
    const currentJson = JSON.stringify(editor.getJSON());

    if (nextJson !== currentJson) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const contextMenu = useEditorContextMenu(editor);
  const imageUpload = useEditorImageUpload(editor);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) {
    return null;
  }

  const editorThemeVars = {
    '--editor-surface': theme.palette.background.paper,
    '--editor-border': theme.palette.divider,
    '--editor-text': theme.palette.text.primary,
    '--editor-muted': theme.palette.text.secondary,
    '--editor-hover-bg': alpha(theme.palette.text.primary, 0.08),
    '--editor-active-bg': alpha(theme.palette.primary.main, 0.16),
    '--editor-active-text': theme.palette.primary.main,
    '--editor-code-bg': theme.palette.mode === 'dark' ? '#0b1220' : '#0f172a',
    '--editor-code-text': theme.palette.mode === 'dark' ? '#dbeafe' : '#e2e8f0',
    '--editor-menu-bg': theme.palette.background.paper,
    '--editor-menu-border': theme.palette.divider,
    '--editor-menu-shadow':
      theme.palette.mode === 'dark'
        ? '0 14px 28px rgba(2, 6, 23, 0.5)'
        : '0 14px 28px rgba(15, 23, 42, 0.15)',
  } as React.CSSProperties;

  return (
    <div className="notion-editor-shell" style={editorThemeVars}>
      <EditorToolbar
        editor={editor}
        onPickImages={() => imageInputRef.current?.click()}
      />
      <EditorBubbleMenu editor={editor} />
      <div className="notion-editor-body">
        <div className="notion-editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>
      <TableContextMenu
        open={contextMenu.isOpen}
        x={contextMenu.position.x}
        y={contextMenu.position.y}
        canMergeCells={contextMenu.canMergeCells}
        canSplitCell={contextMenu.canSplitCell}
        onClose={contextMenu.closeMenu}
        onCopy={contextMenu.copySelection}
        onPaste={() => {
          void contextMenu.pasteFromClipboard();
        }}
        onInsertRowAbove={contextMenu.insertRowAbove}
        onInsertRowBelow={contextMenu.insertRowBelow}
        onInsertColumnLeft={contextMenu.insertColumnLeft}
        onInsertColumnRight={contextMenu.insertColumnRight}
        onDeleteRow={contextMenu.deleteRow}
        onDeleteColumn={contextMenu.deleteColumn}
        onMergeCells={contextMenu.mergeCells}
        onSplitCell={contextMenu.splitCell}
        onToggleHeaderRow={contextMenu.toggleHeaderRow}
        onSelectCell={contextMenu.selectCurrentCell}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) {
            void imageUpload.insertImagesFromFiles(files);
          }
          event.target.value = '';
        }}
      />
    </div>
  );
}
