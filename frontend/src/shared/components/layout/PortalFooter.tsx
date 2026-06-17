import { Box, Stack, Typography } from '@mui/material';

export function PortalFooter() {
  return (
    <Box
      component="footer"
      data-testid="portal-footer"
      sx={{
        mt: 'auto',
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={0.75}
        justifyContent="space-between"
      >
        <Typography variant="caption" color="text.secondary">
          HACCP Cloud Portal
        </Typography>
        <Typography variant="caption" color="text.secondary">
          문의 quality@haccp.local | v1.0.0
        </Typography>
      </Stack>
    </Box>
  );
}
