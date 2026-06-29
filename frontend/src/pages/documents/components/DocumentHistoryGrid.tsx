import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { APP_LABELS } from '../../../shared/constants/labels';

export type DocumentHistoryRow = {
  id: string;
  title: string;
  version: number;
  changedBy: string;
  changedAt: string;
  summary: string;
};

export function DocumentHistoryGrid(props: { rows: DocumentHistoryRow[] }) {
  const { rows } = props;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{APP_LABELS.table.title}</TableCell>
          <TableCell>{APP_LABELS.table.version}</TableCell>
          <TableCell>{APP_LABELS.table.changedBy}</TableCell>
          <TableCell>{APP_LABELS.table.changedAt}</TableCell>
          <TableCell>{APP_LABELS.table.summary}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.version}</TableCell>
            <TableCell>{row.changedBy}</TableCell>
            <TableCell>{new Date(row.changedAt).toLocaleString()}</TableCell>
            <TableCell>{row.summary}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
