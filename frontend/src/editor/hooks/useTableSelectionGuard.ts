import { useEffect, useRef } from 'react';
import { CellSelection } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';

type AnchorCellSelection = {
  $anchorCell?: { pos: number };
  $from: {
    depth: number;
    node: (depth: number) => { type: { spec: { tableRole?: string } } };
    before: (depth: number) => number;
  };
};

export function useTableSelectionGuard(editor: Editor) {
  const lastCellPosRef = useRef<number | null>(null);
  const tableSelectionBookmarkRef = useRef<ReturnType<
    Editor['state']['selection']['getBookmark']
  > | null>(null);

  const rememberCurrentCell = () => {
    const selection = editor.state.selection as unknown as AnchorCellSelection;

    tableSelectionBookmarkRef.current = editor.state.selection.getBookmark();

    if (selection.$anchorCell) {
      lastCellPosRef.current = selection.$anchorCell.pos;
      return;
    }

    for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
      const tableRole = selection.$from.node(depth).type.spec.tableRole;
      if (tableRole === 'cell' || tableRole === 'header_cell') {
        lastCellPosRef.current = selection.$from.before(depth);
        return;
      }
    }
  };

  useEffect(() => {
    const onSelectionUpdate = () => {
      rememberCurrentCell();
    };

    editor.on('selectionUpdate', onSelectionUpdate);
    rememberCurrentCell();

    return () => {
      editor.off('selectionUpdate', onSelectionUpdate);
    };
  }, [editor]);

  const ensureTableCellSelection = (): boolean => {
    const { state, view } = editor;
    const selection = state.selection;

    if ('anchorCell' in selection || 'headCell' in selection) {
      return true;
    }

    if (tableSelectionBookmarkRef.current) {
      try {
        const restoredSelection = tableSelectionBookmarkRef.current.resolve(
          state.doc,
        );
        view.dispatch(state.tr.setSelection(restoredSelection));
        const maybeCell = restoredSelection as unknown as {
          $anchorCell?: { pos: number };
        };
        if (maybeCell.$anchorCell) {
          lastCellPosRef.current = maybeCell.$anchorCell.pos;
          return true;
        }
      } catch {
        // Ignore stale bookmark and continue fallback.
      }
    }

    if (lastCellPosRef.current !== null) {
      try {
        view.dispatch(
          state.tr.setSelection(
            CellSelection.create(state.doc, lastCellPosRef.current),
          ),
        );
        return true;
      } catch {
        // Fallback to nearest node traversal.
      }
    }

    const $from = selection.$from;
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const tableRole = $from.node(depth).type.spec.tableRole;
      if (tableRole === 'cell' || tableRole === 'header_cell') {
        const pos = $from.before(depth);
        lastCellPosRef.current = pos;
        view.dispatch(
          state.tr.setSelection(CellSelection.create(state.doc, pos)),
        );
        return true;
      }
    }

    return false;
  };

  const runCellCommand = (command: () => boolean) => {
    const executed = command();
    if (executed) {
      rememberCurrentCell();
      return true;
    }

    if (!ensureTableCellSelection()) {
      return false;
    }

    const retried = command();
    if (retried) {
      rememberCurrentCell();
    }

    return retried;
  };

  return {
    rememberCurrentCell,
    ensureTableCellSelection,
    runCellCommand,
  };
}
