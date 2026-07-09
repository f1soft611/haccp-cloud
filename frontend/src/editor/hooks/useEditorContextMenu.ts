import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

type ContextPosition = {
  x: number;
  y: number;
};

type UseEditorContextMenuResult = {
  isOpen: boolean;
  position: ContextPosition;
  closeMenu: () => void;
  copySelection: () => void;
  pasteFromClipboard: () => Promise<void>;
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  mergeCells: () => void;
  splitCell: () => void;
  toggleHeaderRow: () => void;
  selectCurrentCell: () => void;
  canMergeCells: boolean;
  canSplitCell: boolean;
};

const DEFAULT_POSITION: ContextPosition = {
  x: 0,
  y: 0,
};

function isTableSelectionActive(editor: Editor): boolean {
  const { selection } = editor.state;

  if ('anchorCell' in selection || 'headCell' in selection) {
    return true;
  }

  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const tableRole = $from.node(depth).type.spec.tableRole;
    if (
      tableRole === 'table' ||
      tableRole === 'row' ||
      tableRole === 'cell' ||
      tableRole === 'header_cell'
    ) {
      return true;
    }
  }

  return false;
}

export function useEditorContextMenu(
  editor: Editor | null,
): UseEditorContextMenuResult {
  const [position, setPosition] = useState<ContextPosition>(DEFAULT_POSITION);
  const [isOpen, setIsOpen] = useState(false);
  const pointerDownRef = useRef(false);
  const pointerStartRef = useRef<ContextPosition>(DEFAULT_POSITION);
  const draggedRef = useRef(false);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const onMouseDownCapture = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      if (mouseEvent.button === 0) {
        const target = mouseEvent.target as HTMLElement | null;
        const isInsideTable = Boolean(target?.closest('table, td, th'));

        pointerDownRef.current = isInsideTable;
        pointerStartRef.current = {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        };
        draggedRef.current = false;
      }

      if (mouseEvent.button !== 2) {
        return;
      }

      const target = mouseEvent.target as HTMLElement | null;
      const isInsideTable = Boolean(target?.closest('table, td, th'));
      if (!isInsideTable) {
        return;
      }

      // Hard-disable right-click interactions in table cells.
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      setIsOpen(false);
    };

    const onMouseMove = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      if (!pointerDownRef.current || draggedRef.current) {
        return;
      }

      const deltaX = Math.abs(mouseEvent.clientX - pointerStartRef.current.x);
      const deltaY = Math.abs(mouseEvent.clientY - pointerStartRef.current.y);
      if (deltaX > 4 || deltaY > 4) {
        draggedRef.current = true;
      }
    };

    const onContextMenu = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement | null;
      const isInsideTable = Boolean(target?.closest('table, td, th'));

      if (isInsideTable) {
        // Disable browser context menu and editor table menu on right-click.
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        setIsOpen(false);
      }
    };

    const onMouseUp = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      if (mouseEvent.button !== 0) {
        return;
      }

      const target = mouseEvent.target as HTMLElement | null;
      const isInsideTable = Boolean(target?.closest('table, td, th'));

      const wasDragged = draggedRef.current;
      pointerDownRef.current = false;
      draggedRef.current = false;

      if (!isInsideTable) {
        setIsOpen(false);
        return;
      }

      if (!wasDragged || !isTableSelectionActive(editor)) {
        setIsOpen(false);
        return;
      }

      const nextPosition = {
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
      };

      setPosition(nextPosition);
      setIsOpen(true);
    };

    const onSelectionUpdate = () => {
      if (!isTableSelectionActive(editor)) {
        setIsOpen(false);
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('mousedown', onMouseDownCapture, true);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('mouseup', onMouseUp);
    editor.on('selectionUpdate', onSelectionUpdate);

    return () => {
      dom.removeEventListener('mousedown', onMouseDownCapture, true);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('mouseup', onMouseUp);
      editor.off('selectionUpdate', onSelectionUpdate);
    };
  }, [editor]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const copySelection = () => {
    if (!editor) {
      return;
    }

    editor.commands.focus();
    document.execCommand('copy');
    closeMenu();
  };

  const pasteFromClipboard = async () => {
    if (!editor) {
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text.trim().length > 0) {
        editor.chain().focus().insertContent(text).run();
      }
    } catch {
      // Clipboard API permission denied in some environments.
    } finally {
      closeMenu();
    }
  };

  const insertRowAbove = () => {
    editor?.chain().focus().addRowBefore().run();
    closeMenu();
  };

  const insertRowBelow = () => {
    editor?.chain().focus().addRowAfter().run();
    closeMenu();
  };

  const insertColumnLeft = () => {
    editor?.chain().focus().addColumnBefore().run();
    closeMenu();
  };

  const insertColumnRight = () => {
    editor?.chain().focus().addColumnAfter().run();
    closeMenu();
  };

  const deleteRow = () => {
    editor?.chain().focus().deleteRow().run();
    closeMenu();
  };

  const deleteColumn = () => {
    editor?.chain().focus().deleteColumn().run();
    closeMenu();
  };

  const mergeCells = () => {
    editor?.chain().focus().mergeCells().run();
    closeMenu();
  };

  const splitCell = () => {
    editor?.chain().focus().splitCell().run();
    closeMenu();
  };

  const toggleHeaderRow = () => {
    editor?.chain().focus().toggleHeaderRow().run();
    closeMenu();
  };

  const selectCurrentCell = () => {
    if (!editor) {
      return;
    }

    const { state, view } = editor;
    const $from = state.selection.$from;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth);
      const tableRole = node.type.spec.tableRole;

      if (tableRole === 'cell' || tableRole === 'header_cell') {
        const pos = $from.before(depth);
        const transaction = state.tr.setSelection(
          NodeSelection.create(state.doc, pos),
        );
        view.dispatch(transaction);
        break;
      }
    }

    closeMenu();
  };

  const canMergeCells = useMemo(() => {
    if (!editor) {
      return false;
    }

    return editor.can().mergeCells();
  }, [editor, isOpen]);

  const canSplitCell = useMemo(() => {
    if (!editor) {
      return false;
    }

    return editor.can().splitCell();
  }, [editor, isOpen]);

  return {
    isOpen,
    position,
    closeMenu,
    copySelection,
    pasteFromClipboard,
    insertRowAbove,
    insertRowBelow,
    insertColumnLeft,
    insertColumnRight,
    deleteRow,
    deleteColumn,
    mergeCells,
    splitCell,
    toggleHeaderRow,
    selectCurrentCell,
    canMergeCells,
    canSplitCell,
  };
}
