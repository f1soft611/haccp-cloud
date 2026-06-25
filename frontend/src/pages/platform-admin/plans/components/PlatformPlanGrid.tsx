import {
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { PlanSummary } from '../../../../services/plan/planAccessService';

export function PlatformPlanGrid(props: {
  rows: PlanSummary[];
  loading?: boolean;
  onMenuMapping: (plan: PlanSummary) => void;
  onFeatureMapping: (plan: PlanSummary) => void;
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { rows, loading = false, onMenuMapping, onFeatureMapping } = props;

  return (
    <AdminGrid ariaLabel="플랜 목록">
      <TableHead>
        <TableRow>
          <TableCell>플랜 코드</TableCell>
          <TableCell>플랜명</TableCell>
          <TableCell>플랜 설명</TableCell>
          <TableCell width={100} align="center">
            상태
          </TableCell>
          <TableCell width={110} align="right">
            메뉴 수
          </TableCell>
          <TableCell width={110} align="right">
            기능 수
          </TableCell>
          <TableCell width={220} align="center">
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`platform-plan-grid-skeleton-${index}`}>
                <TableCell>
                  <Skeleton variant="text" width="50%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Skeleton variant="text" width="30%" sx={{ ml: 'auto' }} />
                </TableCell>
                <TableCell align="right">
                  <Skeleton variant="text" width="30%" sx={{ ml: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Skeleton variant="rounded" width={72} height={28} />
                    <Skeleton variant="rounded" width={72} height={28} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
              플랜 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((plan) => (
              <TableRow key={plan.planCode} hover>
                <TableCell>{plan.planCode}</TableCell>
                <TableCell>{plan.planName || '-'}</TableCell>
                <TableCell>{plan.planDesc || '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={plan.useAt === 'Y' ? '활성' : '비활성'}
                    size="small"
                    color={plan.useAt === 'Y' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">{plan.menuCount}</TableCell>
                <TableCell align="right">{plan.featureCount}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      aria-label="메뉴 매핑"
                      onClick={() => onMenuMapping(plan)}
                      sx={{
                        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                        bgcolor: isDarkMode
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(31, 79, 143, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(31, 79, 143, 0.16)',
                        },
                      }}
                    >
                      <LinkOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="기능 매핑"
                      onClick={() => onFeatureMapping(plan)}
                      sx={{
                        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                        bgcolor: isDarkMode
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(31, 79, 143, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(31, 79, 143, 0.16)',
                        },
                      }}
                    >
                      <TuneOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
