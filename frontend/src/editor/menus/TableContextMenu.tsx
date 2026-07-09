import { Divider, Menu, MenuItem, ListItemText } from '@mui/material';

type TableContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  canMergeCells: boolean;
  canSplitCell: boolean;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColumnLeft: () => void;
  onInsertColumnRight: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onMergeCells: () => void;
  onSplitCell: () => void;
  onToggleHeaderRow: () => void;
  onSelectCell: () => void;
};

export function TableContextMenu(props: TableContextMenuProps) {
  const {
    open,
    x,
    y,
    canMergeCells,
    canSplitCell,
    onClose,
    onCopy,
    onPaste,
    onInsertRowAbove,
    onInsertRowBelow,
    onInsertColumnLeft,
    onInsertColumnRight,
    onDeleteRow,
    onDeleteColumn,
    onMergeCells,
    onSplitCell,
    onToggleHeaderRow,
    onSelectCell,
  } = props;

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={open ? { top: y, left: x } : undefined}
      slotProps={{
        paper: {
          sx: {
            minWidth: 220,
            borderRadius: 2,
          },
        },
      }}
    >
      <MenuItem onClick={onCopy}>
        <ListItemText primary="복사" />
      </MenuItem>
      <MenuItem onClick={onPaste}>
        <ListItemText primary="붙여넣기" />
      </MenuItem>

      <Divider />

      <MenuItem onClick={onInsertRowAbove}>
        <ListItemText primary="위에 행 추가" />
      </MenuItem>
      <MenuItem onClick={onInsertRowBelow}>
        <ListItemText primary="아래에 행 추가" />
      </MenuItem>
      <MenuItem onClick={onInsertColumnLeft}>
        <ListItemText primary="왼쪽 열 추가" />
      </MenuItem>
      <MenuItem onClick={onInsertColumnRight}>
        <ListItemText primary="오른쪽 열 추가" />
      </MenuItem>

      <Divider />

      <MenuItem onClick={onDeleteRow}>
        <ListItemText primary="행 삭제" />
      </MenuItem>
      <MenuItem onClick={onDeleteColumn}>
        <ListItemText primary="열 삭제" />
      </MenuItem>

      <Divider />

      <MenuItem onClick={onToggleHeaderRow}>
        <ListItemText primary="헤더 행 토글" />
      </MenuItem>
      <MenuItem onClick={onSelectCell}>
        <ListItemText primary="셀 선택" />
      </MenuItem>
      <MenuItem onClick={onMergeCells} disabled={!canMergeCells}>
        <ListItemText primary="셀 병합" />
      </MenuItem>
      <MenuItem onClick={onSplitCell} disabled={!canSplitCell}>
        <ListItemText primary="셀 분할" />
      </MenuItem>
    </Menu>
  );
}
