import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  APP_LABELS,
  getActiveLabel,
} from '../../../../shared/constants/labels';

export type DepartmentRow = {
  id: string;
  name: string;
  active: boolean;
};

export function DepartmentGrid(props: {
  rows: DepartmentRow[];
  onToggleActive: (row: DepartmentRow) => void;
}) {
  const { rows, onToggleActive } = props;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{APP_LABELS.table.name}</TableCell>
          <TableCell>{APP_LABELS.table.status}</TableCell>
          <TableCell align="right">{APP_LABELS.table.action}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{getActiveLabel(row.active)}</TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => onToggleActive(row)}>
                {row.active
                  ? APP_LABELS.action.deactivate
                  : APP_LABELS.action.activate}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
