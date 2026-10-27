import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Chip,
  IconButton,
  Skeleton,
  Stack,
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
import { useOpenWorkDraft } from '../../../../shared/hooks/useOpenWorkDraft';
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
  const { openWorkDraft, dialog } = useOpenWorkDraft();

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
      {/* 기존 -> minWidth 없음 / 변경 -> 칼럼 너비 합계로 고정해 좁은 화면에서 가로 스크롤 */}
      <AdminGrid ariaLabel="HACCP 문서 목록" minWidth={1328}>
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
            {/* 기존 -> 상세 / 작성 헤더 두 칸 / 변경 -> 작업 한 칸으로 합침 */}
            <TableCell width={96} align="center">
              작업
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
                {/* 기존 -> 상세 / 작성 스켈레톤 셀 두 개 / 변경 -> 작업 셀 하나에 나란히 */}
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              {/* 기존 -> colSpan 10 / 변경 -> 상세, 작성 열을 작업 열로 합쳐 9 */}
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
                        // 기존 -> row.status === '결재중' / 변경 -> '결재진행중'
                        : row.status === '결재진행중'
                          ? 'warning'
                          : row.status === '임시저장'
                            ? 'info'
                            : 'error'
                    }
                  />
                </TableCell>
                <TableCell align="center">{row.draftedAt}</TableCell>
                <TableCell align="center">{row.updatedAt}</TableCell>
                {/* 기존 -> 상세 / 작성 셀 두 개 / 변경 -> 작업 셀 하나에 두 버튼 나란히 */}
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
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
                          {/* 기존 -> EditOutlinedIcon / 변경 -> 보기 의미에 맞게 눈 아이콘 */}
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="작성하러 가기">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="작성하러 가기"
                          disabled={!row.workId}
                          sx={row.workId ? actionIconSx : undefined}
                          onClick={() => {
                            void openWorkDraft(
                              row.workId,
                              `${location.pathname}${location.search || ''}`,
                            );
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
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
      {dialog}
    </>
  );
}
