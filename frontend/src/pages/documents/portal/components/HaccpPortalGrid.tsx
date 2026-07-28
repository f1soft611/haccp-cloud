import {
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  getWorkCycleLabel,
  getWorkCycleSx,
} from '../../../dashboard/tenant/utils';
import type { PortalSection } from '../types';

type HaccpPortalGridProps = {
  sections: PortalSection[];
  loading: boolean;
};

const DEFAULT_SKELETON_SECTIONS: PortalSection[] = [
  { key: 'skeleton-0', title: '분류', items: [] },
  { key: 'skeleton-1', title: '분류', items: [] },
  { key: 'skeleton-2', title: '분류', items: [] },
];

function assigneeLabel(value: string): string {
  return value || '관리자 외 2명';
}

export function HaccpPortalGrid({ sections, loading }: HaccpPortalGridProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const sectionsToRender =
    loading && sections.length === 0 ? DEFAULT_SKELETON_SECTIONS : sections;

  return (
    <Grid container spacing={1.5}>
      {sectionsToRender.map((section, sectionIndex) => (
        <Grid key={section.key} size={{ xs: 12, lg: 4 }}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              borderColor: isDarkMode
                ? 'rgba(148,163,184,0.24)'
                : 'rgba(15,23,42,0.12)',
              background: isDarkMode
                ? 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))'
                : 'linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,0.95))',
            }}
          >
            <Box
              sx={{
                px: 1.75,
                py: 1.1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(30,64,175,0.35), rgba(29,78,216,0.2))'
                  : 'linear-gradient(135deg, rgba(219,234,254,0.92), rgba(191,219,254,0.8))',
                borderBottom: '1px solid',
                borderColor: isDarkMode
                  ? 'rgba(96,165,250,0.32)'
                  : 'rgba(59,130,246,0.24)',
              }}
            >
              <Typography variant="subtitle1" fontWeight={800}>
                {section.title}
              </Typography>
              <Chip
                size="small"
                label={`${section.items.length}건`}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  bgcolor: isDarkMode
                    ? 'rgba(15,23,42,0.48)'
                    : 'rgba(255,255,255,0.78)',
                  color: isDarkMode ? '#dbeafe' : '#1e3a8a',
                  border: '1px solid',
                  borderColor: isDarkMode
                    ? 'rgba(147,197,253,0.38)'
                    : 'rgba(59,130,246,0.3)',
                }}
              />
            </Box>

            <Box
              sx={{
                px: 1.75,
                py: 0.9,
                borderBottom: '1px solid',
                borderColor: isDarkMode
                  ? 'rgba(148,163,184,0.26)'
                  : 'rgba(15,23,42,0.1)',
                bgcolor: isDarkMode
                  ? 'rgba(15,23,42,0.55)'
                  : 'rgba(241,245,249,0.72)',
              }}
            >
              <Grid container>
                <Grid size={6}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                  >
                    구분명
                  </Typography>
                </Grid>
                <Grid size={2} sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                  >
                    주기
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                  >
                    담당자
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Stack sx={{ maxHeight: 620, overflowY: 'auto' }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Box
                    key={`${section.key}-skeleton-${index}`}
                    data-testid={`haccp-portal-grid-skeleton-${sectionIndex}-${index}`}
                    sx={{
                      px: 1.75,
                      py: 0.9,
                      backgroundColor:
                        index % 2 === 0
                          ? 'background.paper'
                          : isDarkMode
                            ? 'rgba(30,41,59,0.42)'
                            : 'grey.50',
                      borderBottom: '1px solid',
                      borderColor: isDarkMode
                        ? 'rgba(148,163,184,0.24)'
                        : 'rgba(15,23,42,0.08)',
                    }}
                  >
                    <Grid container alignItems="center">
                      <Grid size={6}>
                        <Skeleton variant="text" width="88%" />
                      </Grid>
                      <Grid
                        size={2}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <Skeleton variant="text" width="70%" />
                      </Grid>
                      <Grid size={4}>
                        <Skeleton variant="text" width="82%" />
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : section.items.length === 0 ? (
                <Typography
                  sx={{ px: 1.75, py: 1.75 }}
                  variant="body2"
                  color="text.secondary"
                >
                  표시할 문서가 없습니다.
                </Typography>
              ) : (
                section.items.map((item, index) => (
                  <Box
                    key={`${section.key}-${item.id}-${index}`}
                    sx={{
                      px: 1.75,
                      py: 0.9,
                      backgroundColor:
                        index % 2 === 0
                          ? 'background.paper'
                          : isDarkMode
                            ? 'rgba(30,41,59,0.42)'
                            : 'grey.50',
                      borderBottom: '1px solid',
                      borderColor: isDarkMode
                        ? 'rgba(148,163,184,0.24)'
                        : 'rgba(15,23,42,0.08)',
                    }}
                  >
                    <Grid container alignItems="center">
                      <Grid size={6}>
                        <Typography
                          variant="body2"
                          role="button"
                          tabIndex={0}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'text.primary',
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline',
                            },
                            '&:focus-visible': {
                              outline: '2px solid',
                              outlineColor: 'primary.main',
                              outlineOffset: 2,
                              borderRadius: 0.5,
                            },
                          }}
                          onClick={() => {
                            const query = new URLSearchParams();
                            if (section.title) {
                              query.set('workType', section.title);
                            }
                            if (item.divisionName) {
                              query.set('workDivision', item.divisionName);
                            }
                            if (item.id) {
                              query.set('workDivisionId', item.id);
                            }
                            navigate(`/docs/haccp-doc?${query.toString()}`);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              const query = new URLSearchParams();
                              if (section.title) {
                                query.set('workType', section.title);
                              }
                              if (item.divisionName) {
                                query.set('workDivision', item.divisionName);
                              }
                              if (item.id) {
                                query.set('workDivisionId', item.id);
                              }
                              navigate(`/docs/haccp-doc?${query.toString()}`);
                            }
                          }}
                        >
                          {item.divisionName || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        size={2}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        {(() => {
                          const normalizedCycle = getWorkCycleLabel({
                            cycle: item.cycle,
                            title: item.divisionName || '',
                            category: section.title || '',
                          });

                          return (
                            <Chip
                              size="small"
                              label={normalizedCycle}
                              sx={{
                                height: 22,
                                fontWeight: 700,
                                ...getWorkCycleSx(normalizedCycle),
                              }}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={4}>
                        <Typography variant="body2" color="text.secondary">
                          {assigneeLabel(item.assigneeSummary)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
