import {
  Box,
  Chip,
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTheme } from '@mui/material/styles';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { HaccpBaseRow } from '../types';

export function HaccpBaseGrid(props: {
  rows: HaccpBaseRow[];
  onEdit: (row: HaccpBaseRow) => void;
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { rows, onEdit } = props;

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

  const getCycleChipSx = (cycle: HaccpBaseRow['cycle']) => {
    if (cycle === '일') {
      return {
        bgcolor: isDarkMode ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.14)',
        color: isDarkMode ? '#bbf7d0' : '#166534',
      };
    }
    if (cycle === '주') {
      return {
        bgcolor: isDarkMode ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.14)',
        color: isDarkMode ? '#bae6fd' : '#075985',
      };
    }
    if (cycle === '월') {
      return {
        bgcolor: isDarkMode ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.16)',
        color: isDarkMode ? '#fde68a' : '#92400e',
      };
    }
    return {
      bgcolor: isDarkMode ? 'rgba(236,72,153,0.2)' : 'rgba(236,72,153,0.14)',
      color: isDarkMode ? '#fbcfe8' : '#9d174d',
    };
  };

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
          <TableCell width={290} align="center">
            등록일
          </TableCell>
          <TableCell align="center">사용</TableCell>
          <TableCell align="center">검토/승인</TableCell>
          <TableCell align="center">담당자</TableCell>
          <TableCell align="center">문서</TableCell>
          <TableCell align="center">수정</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} align="center">
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
            <TableCell>{row.categoryName}</TableCell>
            <TableCell align="center">
              <Chip
                size="small"
                label={row.cycle}
                sx={getCycleChipSx(row.cycle)}
              />
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
              <Chip
                size="small"
                label={row.hasDocument ? '생성됨' : '미생성'}
                color={row.hasDocument ? 'primary' : 'default'}
              />
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
        ))}
      </TableBody>
    </AdminGrid>
  );
}
