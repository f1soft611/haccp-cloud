import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Chip,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { listHaccpDocuments } from '../../../../services/documents/haccpDocumentService';

type HaccpDocumentRow = Awaited<ReturnType<typeof listHaccpDocuments>>[number];

export function HaccpDocumentGrid(props: {
  rows: HaccpDocumentRow[];
  loading: boolean;
}) {
  const { rows, loading } = props;
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
    <AdminGrid ariaLabel="HACCP 문서 목록">
      <TableHead>
        <TableRow>
          <TableCell width={72} align="center">
            No
          </TableCell>
          <TableCell width={160}>업무분류</TableCell>
          <TableCell width={180} align="center">
            기안번호
          </TableCell>
          <TableCell sx={{ minWidth: 280 }}>제목</TableCell>
          <TableCell width={120} align="center">
            작성자
          </TableCell>
          <TableCell width={120} align="center">
            상태
          </TableCell>
          <TableCell width={130} align="center">
            기안일
          </TableCell>
          <TableCell width={160} align="center">
            최종수정
          </TableCell>
          <TableCell width={64} align="center">
            상세
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={row.id} hover>
            <TableCell align="center">{index + 1}</TableCell>
            <TableCell>{row.workType}</TableCell>
            <TableCell align="center">{row.draftNumber}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell align="center">{row.writer}</TableCell>
            <TableCell align="center">
              <Chip
                size="small"
                label={row.status}
                color={
                  row.status === '승인'
                    ? 'success'
                    : row.status === '결재중'
                      ? 'warning'
                      : row.status === '임시저장'
                        ? 'info'
                        : 'error'
                }
              />
            </TableCell>
            <TableCell align="center">{row.draftedAt}</TableCell>
            <TableCell align="center">{row.updatedAt}</TableCell>
            <TableCell align="center">
              <Tooltip title="상세 보기">
                <span>
                  <IconButton
                    size="small"
                    aria-label="상세 보기"
                    disabled={!row.approvalId}
                    sx={row.approvalId ? actionIconSx : undefined}
                    onClick={() => {
                      if (!row.approvalId) {
                        return;
                      }
                      navigate(
                        `/approvals/draft/${row.approvalId}?idType=approval`,
                      );
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
              조건에 맞는 문서가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {loading ? (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
              문서 목록을 불러오는 중입니다.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </AdminGrid>
  );
}
