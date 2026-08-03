import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { Box, Menu, MenuItem, Paper } from '@mui/material';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
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
import {
  DocumentFieldExtension,
  type DocumentFieldDisplayMode,
} from '../extensions/documentFieldExtension';
import { DocumentFieldImageExtension } from '../extensions/documentFieldImageExtension';
import { EditorImageExtension } from '../extensions/imageExtension';
import { SlashCommandExtension } from '../extensions/slashCommandExtension';
import {
  StyledTableCell,
  StyledTableHeader,
} from '../extensions/tableCellStyleExtensions';
import { Selection } from '@tiptap/pm/state';
import type { DocumentFieldValues } from '../utils/documentFieldValues';
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

function findLeadingColumnAnchor(
  tableNode: any,
  targetRowIndex: number,
): { rowIndex: number; cellIndex: number } | null {
  const occupancy: number[] = [];
  const anchors: Array<{ rowIndex: number; cellIndex: number } | null> = [];

  for (let rowIndex = 0; rowIndex < tableNode.childCount; rowIndex += 1) {
    if (rowIndex === targetRowIndex) {
      const anchor = anchors[0];
      if ((occupancy[0] ?? 0) > 0 && anchor && anchor.rowIndex < rowIndex) {
        return anchor;
      }
      return null;
    }

    const row = tableNode.child(rowIndex);
    let col = 0;

    for (let cellIndex = 0; cellIndex < row.childCount; cellIndex += 1) {
      while ((occupancy[col] ?? 0) > 0) {
        col += 1;
      }

      const cell = row.child(cellIndex);
      const colspan = Math.max(1, Number(cell.attrs.colspan ?? 1));
      const rowspan = Math.max(1, Number(cell.attrs.rowspan ?? 1));

      for (let offset = 0; offset < colspan; offset += 1) {
        occupancy[col + offset] = Math.max(
          occupancy[col + offset] ?? 0,
          rowspan,
        );
        anchors[col + offset] = { rowIndex, cellIndex };
      }

      col += colspan;
    }

    for (let index = 0; index < occupancy.length; index += 1) {
      occupancy[index] = Math.max(0, (occupancy[index] ?? 0) - 1);
    }
  }

  return null;
}

function getCellPosInRow(
  tableNode: any,
  tablePos: number,
  rowIndex: number,
  cellIndex: number,
): number | null {
  if (
    rowIndex < 0 ||
    rowIndex >= tableNode.childCount ||
    cellIndex < 0 ||
    cellIndex >= tableNode.child(rowIndex).childCount
  ) {
    return null;
  }

  let rowStartPos = tablePos + 1;
  for (let index = 0; index < rowIndex; index += 1) {
    rowStartPos += tableNode.child(index).nodeSize;
  }

  let cellPos = rowStartPos + 1;
  for (let index = 0; index < cellIndex; index += 1) {
    cellPos += tableNode.child(rowIndex).child(index).nodeSize;
  }

  return cellPos;
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
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const tableContextRef = useRef<{
    anchorPos: number;
    tablePos: number;
    rowIndex: number;
    referenceRow: {
      type: string;
      attrs?: Record<string, unknown>;
      content?: JSONContent[];
      marks?: Array<Record<string, unknown>>;
    };
  } | null>(null);
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
      DocumentFieldExtension.configure({
        resolveFieldValue: (fieldKey) => documentFieldValues[fieldKey],
        displayMode: documentFieldDisplayMode,
      }),
      DocumentFieldImageExtension,
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

  const copyPreviousRowToInsertedRow = (
    tablePos: number,
    insertedRowIndex: number,
    sourceRowJson: {
      type: string;
      attrs?: Record<string, unknown>;
      content?: JSONContent[];
      marks?: Array<Record<string, unknown>>;
    },
  ) => {
    if (!editor) {
      return;
    }

    const tableNode = editor.state.doc.nodeAt(tablePos);
    if (
      !tableNode ||
      insertedRowIndex < 0 ||
      insertedRowIndex >= tableNode.childCount
    ) {
      return;
    }

    const insertedRow = tableNode.child(insertedRowIndex);
    if (!insertedRow) {
      return;
    }

    let rowStartPos = tablePos + 1;
    for (let index = 0; index < insertedRowIndex; index += 1) {
      rowStartPos += tableNode.child(index).nodeSize;
    }

    const replacementRow = editor.schema.nodeFromJSON(sourceRowJson as any);

    const tr = editor.state.tr.replaceWith(
      rowStartPos,
      rowStartPos + insertedRow.nodeSize,
      replacementRow,
    );

    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) {
        return;
      }

      editor.view.dispatch(tr);
    });
  };

  const normalizeLeadingMergedCell = (
    tablePos: number,
    sourceRowIndex: number,
    insertedRowIndex: number,
  ) => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const tableNode = editor.state.doc.nodeAt(tablePos);
    if (!tableNode) {
      return;
    }

    const sourceRow = tableNode.child(sourceRowIndex);
    const insertedRow = tableNode.child(insertedRowIndex);
    if (!sourceRow || !insertedRow) {
      return;
    }

    if (insertedRow.childCount <= sourceRow.childCount) {
      return;
    }

    const anchor = findLeadingColumnAnchor(tableNode, sourceRowIndex);
    if (!anchor) {
      return;
    }

    const anchorCellPos = getCellPosInRow(
      tableNode,
      tablePos,
      anchor.rowIndex,
      anchor.cellIndex,
    );
    const insertedFirstCellPos = getCellPosInRow(
      tableNode,
      tablePos,
      insertedRowIndex,
      0,
    );

    if (anchorCellPos === null || insertedFirstCellPos === null) {
      return;
    }

    const anchorCell = editor.state.doc.nodeAt(anchorCellPos);
    const firstCell = editor.state.doc.nodeAt(insertedFirstCellPos);
    if (!anchorCell || !firstCell) {
      return;
    }

    const currentRowspan = Math.max(1, Number(anchorCell.attrs.rowspan ?? 1));
    let tr = editor.state.tr.setNodeMarkup(
      anchorCellPos,
      anchorCell.type,
      {
        ...anchorCell.attrs,
        rowspan: currentRowspan + 1,
      },
      anchorCell.marks,
    );

    tr = tr.delete(
      insertedFirstCellPos,
      insertedFirstCellPos + firstCell.nodeSize,
    );
    editor.view.dispatch(tr);
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

  const handleAddRowFromContextMenu = () => {
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

    const inserted = editor.chain().focus().addRowAfter().run();
    if (!inserted) {
      return;
    }

    normalizeLeadingMergedCell(
      rowContext.tablePos,
      rowContext.rowIndex,
      rowContext.rowIndex + 1,
    );

    copyPreviousRowToInsertedRow(
      rowContext.tablePos,
      rowContext.rowIndex + 1,
      rowContext.referenceRow,
    );
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
          bgcolor: editorCanvasBg,
          '& .tiptap': {
            outline: 'none',
            ...(editorMinHeight > 0 ? { minHeight: editorMinHeight } : {}),
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
          '& .tiptap .document-field-token': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.35,
            mx: 0.25,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: isDarkMode
              ? 'rgba(96, 165, 250, 0.45)'
              : 'primary.main',
            bgcolor: isDarkMode
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(239, 246, 255, 0.95)',
            color: isDarkMode ? '#e2e8f0' : 'primary.dark',
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
            color: editorTextColor,
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
