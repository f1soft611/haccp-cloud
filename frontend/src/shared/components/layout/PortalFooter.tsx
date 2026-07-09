import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export function PortalFooter() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const footerLogoSrc = isDarkMode
    ? '/f1foodlink_wh.png'
    : '/f1foodlink_midd.png';

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
        <Stack direction="row" spacing={1.2} alignItems="center">
          {/* <Typography variant="caption" color="text.secondary">
            문의 quality@haccp.local | v1.0.0
          </Typography> */}
          <Box
            component="img"
            src={footerLogoSrc}
            alt="F1FoodLink"
            sx={{
              display: 'block',
              width: 84,
              height: 14,
              objectFit: 'contain',
              imageRendering: '-webkit-optimize-contrast',
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
