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
import type { PlatformRoleItem } from '../../../../services/platform-admin/platformRoleService';

export function RoleGrid(props: {
  rows: PlatformRoleItem[];
  onToggleActive: (item: PlatformRoleItem) => void;
}) {
  const { rows, onToggleActive } = props;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>권한 코드</TableCell>
          <TableCell>권한명</TableCell>
          <TableCell>{APP_LABELS.field.content}</TableCell>
          <TableCell>{APP_LABELS.table.status}</TableCell>
          <TableCell align="right">{APP_LABELS.table.action}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.description || '-'}</TableCell>
            <TableCell>{getActiveLabel(item.active)}</TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => onToggleActive(item)}>
                {item.active
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
