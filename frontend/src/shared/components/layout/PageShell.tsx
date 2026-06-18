import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';

export function PageShell({ children }: PropsWithChildren) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        flexGrow: 1,
        background: isDarkMode
          ? 'radial-gradient(circle at 84% 8%, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0) 30%), radial-gradient(circle at 0% 100%, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0) 35%), linear-gradient(180deg, #0b1220 0%, #111827 52%, #0f172a 100%)'
          : 'radial-gradient(circle at 0% 0%, rgba(31,79,143,0.08) 0%, rgba(31,79,143,0) 38%), linear-gradient(180deg, #edf3fa 0%, #f7fbff 45%, #f1f6fc 100%)',
      }}
    >
      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}
