import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { type DocumentStatus } from '../../../services/documents/documentsService';
import {
  APP_LABELS,
  getDocumentStatusLabel,
} from '../../../shared/constants/labels';

export type DocumentRow = {
  id: string;
  title: string;
  category: string;
  status: DocumentStatus;
  version: number;
  updatedBy: string;
};

export function DocumentGrid(props: { rows: DocumentRow[] }) {
  const { rows } = props;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{APP_LABELS.table.title}</TableCell>
          <TableCell>{APP_LABELS.table.category}</TableCell>
          <TableCell>{APP_LABELS.table.status}</TableCell>
          <TableCell>{APP_LABELS.table.version}</TableCell>
          <TableCell>{APP_LABELS.table.updatedBy}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{getDocumentStatusLabel(row.status)}</TableCell>
            <TableCell>{row.version}</TableCell>
            <TableCell>{row.updatedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
