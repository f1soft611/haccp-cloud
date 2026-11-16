import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { Box, Menu, MenuItem, Paper } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import StarterKit from '@tiptap/starter-kit';
import { FontFamily, TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { FontSize } from '../extensions/fontSizeExtension';
import {
  DocumentFieldExtension,
  type DocumentFieldDisplayMode,
} from '../extensions/documentFieldExtension';
import { DocumentFieldImageExtension } from '../extensions/documentFieldImageExtension';
import { DocumentFieldAttendeesExtension } from '../extensions/documentFieldAttendeesExtension';
import { DocumentFieldComboExtension } from '../extensions/documentFieldComboExtension';
import { EditorImageExtension } from '../extensions/imageExtension';
import { SlashCommandExtension } from '../extensions/slashCommandExtension';
import {
  StyledTableCell,
  StyledTableHeader,
} from '../extensions/tableCellStyleExtensions';
import { Selection } from '@tiptap/pm/state';
import type { DocumentFieldValues } from '../utils/documentFieldValues';
import {
  hasSpreadsheetClipboardContent,
  normalizeClipboardHtmlForEditor,
  normalizeClipboardTextForEditor,
  normalizeClipboardTextGridForEditor,
} from '../utils/clipboardPaste';
import { addRowBelowWithCopy } from '../utils/tableRowInsert';
import { ResetEditorToolbar } from './reset/ResetEditorToolbar';
import './slashCommand.css';

type NotionLikeEditorProps = {
  content: JSONContent;
  editable?: boolean;
  showToolbar?: boolean;
  enableSlashCommand?: boolean;
  canvasMinHeight?: number;
  editorMinHeight?: number;
  documentFieldDisplayMode?: DocumentFieldDisplayMode;
  enableTableContextMenu?: boolean;
  paperSx?: SxProps<Theme>;
  onChange: (content: JSONContent, html: string) => void;
  documentFieldValues: DocumentFieldValues;
};

function getFirstCellSelectionPosFromRow(
  doc: { nodeAt: (pos: number) => any; resolve: (pos: number) => any },
  tablePos: number,
  rowIndex: number,
): number | null {
  const tableNode = doc.nodeAt(tablePos);
  if (!tableNode || rowIndex < 0 || rowIndex >= tableNode.childCount) {
    return null;
  }

  let rowPos = tablePos + 1;
  for (let index = 0; index < rowIndex; index += 1) {
    rowPos += tableNode.child(index).nodeSize;
  }

  const rowNode = tableNode.child(rowIndex);
  if (!rowNode || rowNode.childCount === 0) {
    return null;
  }

  const firstCellPos = rowPos + 1;
  const selection = Selection.near(doc.resolve(firstCellPos + 1), 1);
  return selection.from;
}

export function NotionLikeEditor(props: NotionLikeEditorProps) {
  const {
    content,
    editable = true,
    showToolbar = true,
    enableSlashCommand = true,
    canvasMinHeight = 520,
    editorMinHeight = 420,
    documentFieldDisplayMode = 'token',
    enableTableContextMenu = false,
    paperSx,
    onChange,
    documentFieldValues,
  } = props;
  const lastSerializedContentRef = useRef<string>('');
  const editorRef = useRef<Editor | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const tableContextRef = useRef<{
    tablePos: number;
    rowIndex: number;
  } | null>(null);
  // 기존 -> isDarkMode 로 에디터 캔버스, 글자, 표 테두리 색 계산 / 변경 -> theme.ts 의 editor 토큰을 sx 에서 직접 사용

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
      }),
      FontSize,
      DocumentFieldExtension.configure({
        resolveFieldValue: (fieldKey) => documentFieldValues[fieldKey],
        displayMode: documentFieldDisplayMode,
      }),
      DocumentFieldImageExtension,
      DocumentFieldAttendeesExtension,
      DocumentFieldComboExtension,
      EditorImageExtension,
      TaskList,
      TaskItem.configure({
        nested: false,
      }),
      ...(enableSlashCommand ? [SlashCommandExtension] : []),
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
    editorProps: {
      transformPastedHTML: (html) =>
          html.includes('data-pm-slice')
              ? html
              : normalizeClipboardHtmlForEditor(html),
      transformPastedText: normalizeClipboardTextForEditor,
      // 표는 엑셀 표시값을 맞추려면 plain text 가 필요해서 여기서 직접 넣는다
      handlePaste: (view, event) => {
        const data = event.clipboardData;
        const html = data?.getData('text/html') ?? '';
        if (
            !data ||
            html.includes('data-pm-slice') ||
            !hasSpreadsheetClipboardContent(data)
        ) {
          return false;
        }

        if (!view.editable) {
          return true;
        }

        const text = data.getData('text/plain') ?? '';
        const normalized = html
            ? normalizeClipboardHtmlForEditor(html, text)
            : normalizeClipboardTextGridForEditor(text);
        if (normalized) {
          editorRef.current?.commands.insertContent(normalized);
        }
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = currentEditor.getJSON();
      lastSerializedContentRef.current = JSON.stringify(nextContent);
      onChange(nextContent, currentEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) {
        return;
      }

      const currentJson = JSON.stringify(editor.getJSON());
      if (currentJson === nextJson) {
        return;
      }

      editor.commands.setContent(content, { emitUpdate: false });
    });
  }, [content, editor]);

  const resolveTableRowContextFromPos = (pos: number) => {
    if (!editor) {
      return null;
    }

    const $pos = editor.state.doc.resolve(pos);
    let tableDepth = -1;
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const tableRole = $pos.node(depth).type.spec.tableRole;
      if (tableRole === 'table') {
        tableDepth = depth;
        break;
      }
    }

    if (tableDepth < 0) {
      return null;
    }

    const tableNode = $pos.node(tableDepth);
    const rowIndex = $pos.index(tableDepth);
    if (rowIndex < 0 || rowIndex >= tableNode.childCount) {
      return null;
    }

    return {
      anchorPos: pos,
      tablePos: $pos.start(tableDepth) - 1,
      rowIndex,
      referenceRow: tableNode.child(rowIndex).toJSON() as {
        type: string;
        attrs?: Record<string, unknown>;
        content?: JSONContent[];
        marks?: Array<Record<string, unknown>>;
      },
    };
  };

  const focusTableRowForCommand = (tablePos: number, rowIndex: number) => {
    if (!editor) {
      return false;
    }

    const selectionPos = getFirstCellSelectionPosFromRow(
      editor.state.doc,
      tablePos,
      rowIndex,
    );

    if (selectionPos === null) {
      return false;
    }

    editor.chain().focus().setTextSelection(selectionPos).run();
    return true;
  };

  // 우클릭한 행 바로 아래에 같은 내용의 행 추가 (병합 셀 유지)
  const handleAddRowFromContextMenu = () => {
    if (!editor || !editable) {
      return;
    }

    const rowContext = tableContextRef.current;
    if (!rowContext) {
      return;
    }

    const tr = addRowBelowWithCopy(editor.state.tr, rowContext.tablePos, rowContext.rowIndex);
    if (tr) {
      editor.view.dispatch(tr);
      editor.commands.focus();
    }
  };

  const handleDeleteRowFromContextMenu = () => {
    if (!editor || !editable) {
      return;
    }

    const rowContext = tableContextRef.current;
    if (!rowContext) {
      return;
    }

    if (!focusTableRowForCommand(rowContext.tablePos, rowContext.rowIndex)) {
      return;
    }

    editor.chain().focus().deleteRow().run();
  };

  const handleOpenTableContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!editor || !editable || !enableTableContextMenu) {
      return;
    }

    const targetElement = event.target as HTMLElement | null;
    const cellElement = targetElement?.closest('td,th');
    if (!cellElement) {
      return;
    }

    event.preventDefault();

    const coordsPos = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (!coordsPos) {
      return;
    }

    const nextContext = resolveTableRowContextFromPos(coordsPos.pos);
    if (!nextContext) {
      return;
    }

    tableContextRef.current = nextContext;

    setContextMenuPosition({
      left: event.clientX + 2,
      top: event.clientY - 6,
    });
  };

  const handleCloseTableContextMenu = () => {
    setContextMenuPosition(null);
    tableContextRef.current = null;
  };

  if (!editor) {
    return null;
  }

  return (
    <Paper
      sx={{
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: 'divider',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        },
        ...paperSx,
      }}
    >
      {showToolbar ? (
        <ResetEditorToolbar editor={editor} disabled={!editable} />
      ) : null}
      <Box
        onContextMenu={handleOpenTableContextMenu}
        sx={{
          ...(canvasMinHeight > 0 ? { minHeight: canvasMinHeight } : {}),
          p: { xs: 2, md: 3 },
          bgcolor: 'editor.canvas',
          '& .tiptap': {
            outline: 'none',
            ...(editorMinHeight > 0 ? { minHeight: editorMinHeight } : {}),
            color: 'editor.text',
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
            m: 0,
            listStyle: 'none',
          },
          '& .tiptap ul[data-type="taskList"] li': {
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            my: 0,
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
            mt: 0,
            lineHeight: 1,
          },
          '& .tiptap ul[data-type="taskList"] li > label span': {
            display: 'none',
          },
          '& .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: center"]) > div, & .tiptap ul[data-type="taskList"] li:has(> div > p[style*="text-align: right"]) > div, & .tiptap ul[data-type="taskList"] li:has(> p[style*="text-align: right"]) > div':
            {
              flex: '0 1 auto',
            },
          '& .tiptap ul[data-type="taskList"] li > label input': {
            width: 14,
            height: 14,
            margin: 0,
          },
          // 기존 -> 라벨 영역 너비/높이 0 으로 숨김 / 변경 -> 라벨 텍스트를 체크박스 옆에 표시
          '& .tiptap ul[data-type="taskList"] li > div': {
            flex: '1 1 auto',
            minWidth: 0,
            pl: 0.5,
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
            borderColor: 'editor.tableBorder',
            p: 1,
            minWidth: '1em',
            boxSizing: 'border-box',
            verticalAlign: 'middle',
            position: 'relative',
          },
          '& .tiptap th': {
            bgcolor: 'editor.tableHeaderBg',
            fontWeight: 700,
          },
          '& .tiptap td[data-pasted-style], & .tiptap th[data-pasted-style]': {
            p: 0,
          },
          '& .tiptap td[data-pasted-style] p, & .tiptap th[data-pasted-style] p': {
            my: 0,
            lineHeight: 'normal',
            whiteSpace: 'pre-wrap',
          },
          '& .tiptap .selectedCell::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            border: '2px solid',
            borderColor: 'primary.main',
            pointerEvents: 'none',
          },
          '& .tiptap .document-field-token': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.35,
            mx: 0.25,
            borderRadius: 1.5,
            border: '1px solid',
            // 기존 -> isDarkMode 로 칩 색 분기 / 변경 -> editor 토큰
            borderColor: 'editor.chipBorder',
            bgcolor: 'editor.chipBg',
            color: 'editor.chipText',
            fontSize: 13,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
          },
          '& .tiptap .document-field-token--value': {
            display: 'inline',
            padding: 0,
            margin: 0,
            border: 'none',
            borderRadius: 0,
            backgroundColor: 'transparent',
            color: 'editor.text',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            whiteSpace: 'pre-wrap',
          },
          '& .tiptap .document-field-token__value': {
            fontWeight: 500,
          },
          '& .tiptap .document-field-token__group': {
            opacity: 0.72,
            fontWeight: 700,
          },
          '& .tiptap .document-field-token__label': {
            fontWeight: 700,
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

      <Menu
        open={Boolean(contextMenuPosition)}
        onClose={handleCloseTableContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenuPosition
            ? { top: contextMenuPosition.top, left: contextMenuPosition.left }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            handleAddRowFromContextMenu();
            handleCloseTableContextMenu();
          }}
        >
          행 추가
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteRowFromContextMenu();
            handleCloseTableContextMenu();
          }}
        >
          행 삭제
        </MenuItem>
      </Menu>
    </Paper>
  );
}
