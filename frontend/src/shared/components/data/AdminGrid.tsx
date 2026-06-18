import { Table, TableContainer } from '@mui/material';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';

const DEFAULT_CONTAINER_SX = {
  border: '1px solid rgba(31, 79, 143, 0.22)',
  borderRadius: 2,
  boxShadow: '0 10px 28px rgba(17, 43, 74, 0.1)',
  overflow: 'auto',
  bgcolor: '#fff',
};

const DEFAULT_TABLE_SX = {
  '& .MuiTableCell-head': {
    bgcolor: '#1f4f8f',
    color: '#ffffff',
    fontWeight: 700,
    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid rgba(31, 79, 143, 0.12)',
  },
};

export type AdminGridProps = {
  ariaLabel: string;
  children: ReactNode;
  maxHeight?: number;
};

export function AdminGrid({
  ariaLabel,
  children,
  maxHeight = 620,
}: AdminGridProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{ ...DEFAULT_CONTAINER_SX, maxHeight }}
    >
      <Table
        size="small"
        stickyHeader
        aria-label={ariaLabel}
        sx={DEFAULT_TABLE_SX}
      >
        {children}
      </Table>
    </TableContainer>
  );
}
