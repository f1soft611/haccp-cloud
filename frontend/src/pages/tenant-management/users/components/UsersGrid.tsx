import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { UserItem } from '../../../../services/common/usersService';

type UsersGridProps = {
  rows: UserItem[];
  loading?: boolean;
  onEdit: (user: UserItem) => void;
  onToggle: (user: UserItem) => void;
};

function roleLabel(roleCode: string) {
  if (roleCode === 'PLATFORM_ADMIN') return '플랫폼관리자';
  if (roleCode === 'TENANT_ADMIN') return '업체관리자';
  return '일반사용자';
}

export function UsersGrid({ rows, loading, onEdit, onToggle }: UsersGridProps) {
  return (
    <Paper sx={{ p: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>이름</TableCell>
            <TableCell>이메일</TableCell>
            <TableCell>부서</TableCell>
            <TableCell>권한</TableCell>
            <TableCell>상태</TableCell>
            <TableCell align="right">작업</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.department || '-'}</TableCell>
              <TableCell>{roleLabel(row.roleCode)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={row.active ? 'success' : 'default'}
                  label={row.active ? '활성' : '비활성'}
                />
              </TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onEdit(row)}>
                  수정
                </Button>
                <Button size="small" onClick={() => onToggle(row)}>
                  {row.active ? '로그인 차단' : '차단 해제'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!loading && rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          조회된 사용자가 없습니다.
        </Typography>
      ) : null}
    </Paper>
  );
}
