import { Box, Stack, TextField, Typography } from '@mui/material';
import { APP_LABELS } from '../ui/labels';

export function TopGovBar() {
  return (
    <Box
      data-testid="top-gov-bar"
      sx={{
        bgcolor: 'primary.main',
        color: 'common.white',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <Box sx={{ px: { xs: 2, md: 3 }, py: 0.75, bgcolor: 'rgba(0,0,0,0.12)' }}>
        <Typography variant="caption">{APP_LABELS.header.govNotice}</Typography>
      </Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ px: { xs: 2, md: 3 }, py: 1.2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
            {APP_LABELS.appTitle}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            {APP_LABELS.appSubtitle}
          </Typography>
        </Stack>
        <TextField
          size="small"
          placeholder={APP_LABELS.header.searchPlaceholder}
          sx={{
            ml: { md: 'auto' },
            minWidth: { xs: '100%', md: 280 },
            bgcolor: 'common.white',
            borderRadius: 999,
            '& .MuiOutlinedInput-root': { borderRadius: 999 },
          }}
        />
      </Stack>
    </Box>
  );
}
