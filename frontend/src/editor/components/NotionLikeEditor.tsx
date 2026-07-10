import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { useEffect, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { FontSize } from '../extensions/fontSizeExtension';
import { SlashCommandExtension } from '../extensions/slashCommandExtension';
import {
  StyledTableCell,
  StyledTableHeader,
} from '../extensions/tableCellStyleExtensions';
import { ResetEditorToolbar } from './reset/ResetEditorToolbar';
import './slashCommand.css';

type NotionLikeEditorProps = {
  content: JSONContent;
  editable?: boolean;
  onChange: (content: JSONContent, html: string) => void;
};

export function NotionLikeEditor(props: NotionLikeEditorProps) {
  const { content, editable = true, onChange } = props;
  const lastSerializedContentRef = useRef<string>('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const editorCanvasBg = isDarkMode ? '#f8fafc' : theme.palette.common.white;
  const editorTextColor = isDarkMode ? '#0f172a' : theme.palette.text.primary;
  const tableBorderColor = isDarkMode
    ? 'rgba(15, 23, 42, 0.35)'
    : theme.palette.divider;

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
      }),
      FontSize,
      TaskList,
      TaskItem.configure({
        nested: false,
      }),
      SlashCommandExtension,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        cellMinWidth: 25,
        lastColumnResizable: true,
        handleWidth: 8,
      }),
      TableRow,
      StyledTableHeader,
      StyledTableCell,
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = currentEditor.getJSON();
      lastSerializedContentRef.current = JSON.stringify(nextContent);
      onChange(nextContent, currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const initialContent = editor.getJSON();
    lastSerializedContentRef.current = JSON.stringify(initialContent);

    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextJson = JSON.stringify(content);
    if (nextJson === lastSerializedContentRef.current) {
      return;
    }

    lastSerializedContentRef.current = nextJson;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <Paper
      sx={{
        borderRadius: 0,
        overflow: 'visible',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <ResetEditorToolbar editor={editor} disabled={!editable} />
      <Box
        sx={{
          minHeight: 520,
          p: { xs: 2, md: 3 },
          bgcolor: editorCanvasBg,
          '& .tiptap': {
            outline: 'none',
            minHeight: 420,
            color: editorTextColor,
            fontSize: 15,
            lineHeight: 1.7,
          },
          '& .tiptap h2': {
            fontSize: 22,
            lineHeight: 1.3,
            mt: 3,
            mb: 1,
          },
          '& .tiptap p': {
            my: 1,
          },
          '& .tiptap mark': {
            borderRadius: 6,
            padding: '0.1rem 0.35rem',
            boxDecorationBreak: 'clone',
          },
          '& .tiptap ul[data-type="taskList"]': {
            pl: 0,
            listStyle: 'none',
          },
          '& .tiptap ul[data-type="taskList"] li': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            my: 0.9,
          },
          '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: center"]), & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: center"])':
            {
              justifyContent: 'center',
            },
          '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: right"]), & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: right"])':
            {
              justifyContent: 'flex-end',
            },
          '& .tiptap ul[data-type="taskList"] li > label': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
            mt: '6px',
            lineHeight: 1,
          },
          '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: right"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: right"]) > div':
            {
              flex: '0 1 auto',
            },
          '& .tiptap ul[data-type="taskList"] li > label input': {
            width: 16,
            height: 16,
            margin: 0,
          },
          '& .tiptap ul[data-type="taskList"] li > div': {
            flex: 1,
            minWidth: 0,
          },
          '& .tiptap ul[data-type="taskList"] li > div > p, & .tiptap ul[data-type="taskList"] li > p':
            {
              margin: 0,
            },
          '& .tiptap table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 2,
            tableLayout: 'fixed',
          },
          '& .tiptap .tableWrapper': {
            overflowX: 'auto',
          },
          '& .tiptap th, & .tiptap td': {
            border: '1px solid',
            borderColor: tableBorderColor,
            p: 1,
            minWidth: '1em',
            boxSizing: 'border-box',
            verticalAlign: 'top',
            position: 'relative',
          },
          '& .tiptap th': {
            bgcolor: isDarkMode ? '#eef2f7' : 'common.white',
            fontWeight: 700,
          },
          '& .tiptap .selectedCell::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            border: '2px solid',
            borderColor: 'primary.main',
            pointerEvents: 'none',
          },
          '& .tiptap .column-resize-handle': {
            position: 'absolute',
            right: -2,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: '#aad2ff',
            opacity: 0.35,
            pointerEvents: 'none',
          },
          '& .tiptap.resize-cursor': {
            cursor: 'col-resize',
          },
          '& .tiptap.resize-cursor *': {
            cursor: 'col-resize !important',
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}
