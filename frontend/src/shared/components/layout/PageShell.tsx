import { Box, Container } from '@mui/material';
import type { PropsWithChildren } from 'react';

export function PageShell({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        background:
          'radial-gradient(circle at 0% 0%, rgba(31,79,143,0.08) 0%, rgba(31,79,143,0) 38%), linear-gradient(180deg, #edf3fa 0%, #f7fbff 45%, #f1f6fc 100%)',
      }}
    >
      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}
