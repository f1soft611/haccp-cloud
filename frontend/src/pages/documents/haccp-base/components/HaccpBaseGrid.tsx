import {
  Box,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTheme } from '@mui/material/styles';
import {
  getWorkCycleLabel,
  getWorkCycleSx,
} from '../../../dashboard/tenant/utils';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { HaccpBaseRow } from '../types';

export function HaccpBaseGrid(props: {
  rows: HaccpBaseRow[];
  loading: boolean;
  onEdit: (row: HaccpBaseRow) => void;
  onOpenEditorPage: (rowId: string) => void;
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { rows, loading, onEdit, onOpenEditorPage } = props;

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

  const getDocumentIconSx = (hasDocument: boolean) => ({
    fontSize: 20,
    color: hasDocument
      ? isDarkMode
        ? '#e2e8f0'
        : '#0f172a'
      : isDarkMode
        ? '#94a3b8'
        : '#9ca3af',
    bgcolor: hasDocument
      ? isDarkMode
        ? 'rgba(226, 232, 240, 0.18)'
        : 'rgba(15, 23, 42, 0.1)'
      : isDarkMode
        ? 'rgba(148, 163, 184, 0.16)'
        : 'rgba(156, 163, 175, 0.16)',
    borderRadius: 1.5,
  });

  return (
    <AdminGrid ariaLabel="HACCP 양식 목록">
      <TableHead>
        <TableRow>
          <TableCell width={72} align="center">
            No
          </TableCell>
          <TableCell sx={{ minWidth: 200 }}>구분명</TableCell>
          <TableCell width={200}>분류</TableCell>
          <TableCell width={120} align="center">
            등록주기
          </TableCell>
          <TableCell width={120} align="center">
            등록자
          </TableCell>
          <TableCell width={250} align="center">
            등록일
          </TableCell>
          <TableCell width={70} align="center">
            사용
          </TableCell>
          <TableCell width={110} align="center">
            검토/승인
          </TableCell>
          <TableCell width={90} align="center">
            담당자
          </TableCell>
          <TableCell width={70} align="center">
            문서
          </TableCell>
          <TableCell width={70} align="center">
            수정
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`haccp-base-grid-skeleton-${index}`}
                data-testid={`haccp-base-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton variant="text" width={24} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="72%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={52}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="70%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="72%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={52}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={120}
                    height={54}
                    sx={{ mx: 'auto', borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="62%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={28}
                    height={28}
                    sx={{ mx: 'auto', borderRadius: 1.5 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={28}
                    height={28}
                    sx={{ mx: 'auto', borderRadius: 1.5 }}
                  />
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} align="center">
              조회된 양식이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell align="center">{row.no}</TableCell>
                <TableCell>
                  {row.divisionCode}.{row.divisionName}
                </TableCell>
                <TableCell>{row.categoryName}</TableCell>
                <TableCell align="center">
                  {(() => {
                    const cycleLabel = getWorkCycleLabel({
                      cycle: row.cycle,
                      title: row.divisionName,
                      category: row.categoryName,
                    });

                    return (
                      <Chip
                        size="small"
                        label={cycleLabel}
                        sx={{
                          height: 22,
                          fontWeight: 700,
                          ...getWorkCycleSx(cycleLabel),
                        }}
                      />
                    );
                  })()}
                </TableCell>
                <TableCell align="center">{row.createdBy}</TableCell>
                <TableCell align="center">{row.createdAt}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={row.useAt === 'Y' ? '사용' : '미사용'}
                    color={row.useAt === 'Y' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack
                    spacing={0.75}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isDarkMode
                        ? 'rgba(148, 163, 184, 0.3)'
                        : 'rgba(148, 163, 184, 0.35)',
                      bgcolor: isDarkMode
                        ? 'rgba(148, 163, 184, 0.08)'
                        : 'rgba(248, 250, 252, 0.9)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr',
                        columnGap: 0.75,
                        rowGap: 0.3,
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        검토
                      </Typography>
                      <Chip
                        size="small"
                        label={row.reviewerName || '-'}
                        variant="outlined"
                        color="info"
                        sx={{ justifySelf: 'start', fontWeight: 600 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        승인
                      </Typography>
                      <Chip
                        size="small"
                        label={row.approverName || '-'}
                        variant="outlined"
                        color="warning"
                        sx={{ justifySelf: 'start', fontWeight: 600 }}
                      />
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {row.assigneeSummary || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip
                    title={
                      row.hasDocument
                        ? '생성된 문서 내역 보기'
                        : '문서 생성 페이지로 이동'
                    }
                  >
                    <IconButton
                      size="small"
                      aria-label={
                        row.hasDocument
                          ? '문서 내역 보기'
                          : '문서 생성 페이지 이동'
                      }
                      onClick={() => onOpenEditorPage(row.id)}
                      sx={{ p: 0 }}
                    >
                      <DescriptionOutlinedIcon
                        fontSize="small"
                        sx={getDocumentIconSx(row.hasDocument)}
                      />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" justifyContent="center">
                    <Tooltip title="업무 수정">
                      <IconButton
                        size="small"
                        aria-label="업무 수정"
                        onClick={() => onEdit(row)}
                        sx={actionIconSx}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
