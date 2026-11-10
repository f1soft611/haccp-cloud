import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Minus,
  PenLine,
  Rows3,
  Scissors,
  Split,
  SquarePlus,
  SquareSplitVertical,
} from 'lucide-react';
import { Menu, MenuItem, Stack, Typography } from '@mui/material';
import type { CellVerticalAlign } from '../../utils/editorTableTypes';

type TableEditMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onInsertTable: () => void;
  onRunTableCommand: (
    command: () => void,
    requireCellSelection?: boolean,
  ) => void;
  onApplyCellVerticalAlign: (verticalAlign: CellVerticalAlign) => void;
  onAddRowAfter: () => void;
  onAddColumnAfter: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onMergeCells: () => void;
  onSplitCell: () => void;
};

export function TableEditMenu(props: TableEditMenuProps) {
  const {
    anchorEl,
    open,
    onClose,
    onInsertTable,
    onRunTableCommand,
    onApplyCellVerticalAlign,
    onAddRowAfter,
    onAddColumnAfter,
    onDeleteRow,
    onDeleteColumn,
    onMergeCells,
    onSplitCell,
  } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <MenuItem onClick={() => onRunTableCommand(onInsertTable, false)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Rows3  />
          <Typography variant="body2">표 삽입</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onAddRowAfter)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SquarePlus  />
          <Typography variant="body2">행 추가</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onAddColumnAfter)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PenLine  />
          <Typography variant="body2">열 추가</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onDeleteRow)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Minus  />
          <Typography variant="body2">행 삭제</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onDeleteColumn)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Scissors  />
          <Typography variant="body2">열 삭제</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onMergeCells)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SquareSplitVertical  />
          <Typography variant="body2">셀 병합</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onSplitCell)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Split  />
          <Typography variant="body2">병합 해제</Typography>
        </Stack>
      </MenuItem>
      <MenuItem
        onClick={() =>
          onRunTableCommand(() => {
            onApplyCellVerticalAlign('top');
          })
        }
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AlignVerticalJustifyStart  />
          <Typography variant="body2">위 정렬</Typography>
        </Stack>
      </MenuItem>
      <MenuItem
        onClick={() =>
          onRunTableCommand(() => {
            onApplyCellVerticalAlign('middle');
          })
        }
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AlignVerticalJustifyCenter  />
          <Typography variant="body2">가운데 정렬</Typography>
        </Stack>
      </MenuItem>
      <MenuItem
        onClick={() =>
          onRunTableCommand(() => {
            onApplyCellVerticalAlign('bottom');
          })
        }
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AlignVerticalJustifyEnd  />
          <Typography variant="body2">아래 정렬</Typography>
        </Stack>
      </MenuItem>
    </Menu>
  );
}
