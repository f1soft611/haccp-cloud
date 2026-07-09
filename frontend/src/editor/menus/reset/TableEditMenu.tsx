import AddBoxRounded from '@mui/icons-material/AddBoxRounded';
import BorderColorRounded from '@mui/icons-material/BorderColorRounded';
import CallSplitRounded from '@mui/icons-material/CallSplitRounded';
import ContentCutRounded from '@mui/icons-material/ContentCutRounded';
import SplitscreenRounded from '@mui/icons-material/SplitscreenRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';
import VerticalAlignBottomRounded from '@mui/icons-material/VerticalAlignBottomRounded';
import VerticalAlignCenterRounded from '@mui/icons-material/VerticalAlignCenterRounded';
import VerticalAlignTopRounded from '@mui/icons-material/VerticalAlignTopRounded';
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
          <TableRowsRounded fontSize="small" />
          <Typography variant="body2">표 삽입</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onAddRowAfter)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AddBoxRounded fontSize="small" />
          <Typography variant="body2">행 추가</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onAddColumnAfter)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <BorderColorRounded fontSize="small" />
          <Typography variant="body2">열 추가</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onDeleteRow)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <RemoveRounded fontSize="small" />
          <Typography variant="body2">행 삭제</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onDeleteColumn)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ContentCutRounded fontSize="small" />
          <Typography variant="body2">열 삭제</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onMergeCells)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SplitscreenRounded fontSize="small" />
          <Typography variant="body2">셀 병합</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => onRunTableCommand(onSplitCell)}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CallSplitRounded fontSize="small" />
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
          <VerticalAlignTopRounded fontSize="small" />
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
          <VerticalAlignCenterRounded fontSize="small" />
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
          <VerticalAlignBottomRounded fontSize="small" />
          <Typography variant="body2">아래 정렬</Typography>
        </Stack>
      </MenuItem>
    </Menu>
  );
}
