import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Chip,
  IconButton,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';
import type { HaccpDocumentItem } from '../../../../services/documents/haccpDocumentService';

export function HaccpDocumentGrid(props: {
  rows: HaccpDocumentItem[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const {
    rows,
    loading,
    pageIndex,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
  } = props;
  const navigate = useNavigate();
  const location = useLocation();
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
    <>
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
            <TableCell width={140} align="center">
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
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`haccp-document-grid-skeleton-${index}`}
                data-testid={`haccp-document-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton variant="text" width={24} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="72%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="68%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="84%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={56}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="72%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="72%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={32}
                    height={32}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                조건에 맞는 문서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={row.id} hover>
                <TableCell align="center">
                  {(pageIndex - 1) * pageSize + index + 1}
                </TableCell>
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
                          const returnTo = `${location.pathname}${location.search || ''}`;
                          const query = new URLSearchParams({
                            idType: 'approval',
                            returnTo,
                          });
                          navigate(
                            `/approvals/draft/${row.approvalId}?${query.toString()}`,
                          );
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}
