import {
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTheme } from '@mui/material/styles';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { HaccpBaseRow } from '../types';

export function HaccpBaseGrid(props: {
  rows: HaccpBaseRow[];
  onOpenAssigneePage: (rowId: string) => void;
  onOpenEditorPage: (rowId: string) => void;
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { rows, onOpenAssigneePage, onOpenEditorPage } = props;

  const actionIconSx = {
    color: isDarkMode ? '#fbbf24' : '#1f4f8f',
    bgcolor: isDarkMode
      ? 'rgba(251, 191, 36, 0.12)'
      : 'rgba(31, 79, 143, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(251, 191, 36, 0.2)'
        : 'rgba(31, 79, 143, 0.16)',
    },
  };

  return (
    <AdminGrid ariaLabel="HACCP 양식 목록">
      <TableHead>
        <TableRow>
          <TableCell width={72} align="center">
            No
          </TableCell>
          <TableCell sx={{ minWidth: 420 }}>구분명</TableCell>
          <TableCell width={160}>분류</TableCell>
          <TableCell width={120}>등록주기</TableCell>
          <TableCell width={120}>등록자</TableCell>
          <TableCell width={180} align="center">
            등록일
          </TableCell>
          <TableCell width={86} align="center">
            담당자
          </TableCell>
          <TableCell width={86} align="center">
            문서
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} align="center">
              조회된 양식이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell align="center">{row.no}</TableCell>
            <TableCell>
              {row.divisionCode}.{row.divisionName}
            </TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.cycle}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell>{row.createdAt}</TableCell>
            <TableCell align="center">
              <Stack direction="row" justifyContent="center">
                <Tooltip title="담당자 설정">
                  <IconButton
                    size="small"
                    aria-label="담당자 설정"
                    onClick={() => onOpenAssigneePage(row.id)}
                    sx={actionIconSx}
                  >
                    <AssignmentIndOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
            <TableCell align="center">
              <Stack direction="row" justifyContent="center">
                <Tooltip title="문서생성/편집">
                  <IconButton
                    size="small"
                    aria-label="문서생성/편집"
                    onClick={() => onOpenEditorPage(row.id)}
                    sx={actionIconSx}
                  >
                    <DescriptionOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminGrid>
  );
}
