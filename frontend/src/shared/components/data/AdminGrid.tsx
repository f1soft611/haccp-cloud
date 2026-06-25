import { Table, TableContainer } from '@mui/material';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';

const DEFAULT_CONTAINER_SX = {
  border: '1px solid rgba(66, 111, 106, 0.24)',
  borderRadius: 0.5,
  boxShadow: '0 8px 18px rgba(66, 111, 106, 0.08)',
  overflow: 'auto',
  bgcolor: '#fff',
};

const DEFAULT_TABLE_SX = {
  '& .MuiTableCell-head': {
    bgcolor: '#d7ecea',
    color: '#2f5f5b',
    fontWeight: 700,
    borderBottom: '1px solid rgba(66, 111, 106, 0.28)',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid rgba(15, 118, 110, 0.12)',
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const containerSx = {
    border: isDarkMode
      ? '1px solid rgba(251, 191, 36, 0.28)'
      : DEFAULT_CONTAINER_SX.border,
    borderRadius: DEFAULT_CONTAINER_SX.borderRadius,
    boxShadow: isDarkMode
      ? '0 16px 36px rgba(2, 6, 23, 0.55)'
      : DEFAULT_CONTAINER_SX.boxShadow,
    overflow: DEFAULT_CONTAINER_SX.overflow,
    bgcolor: isDarkMode ? '#111827' : DEFAULT_CONTAINER_SX.bgcolor,
    maxHeight,
  };

  const tableSx = isDarkMode
    ? {
        '& .MuiTableCell-head': {
          bgcolor: '#172131',
          color: '#fef3c7',
          fontWeight: 700,
          borderBottom: '1px solid rgba(251, 191, 36, 0.26)',
        },
        '& .MuiTableCell-root': {
          color: '#f8fafc',
          borderBottom: '1px solid rgba(148, 163, 184, 0.24)',
        },
        '& .MuiTableRow-root': {
          bgcolor: '#111827',
          '&:hover': {
            bgcolor: '#1b2535',
          },
        },
      }
    : DEFAULT_TABLE_SX;

  return (
    <TableContainer component={Paper} sx={containerSx}>
      <Table size="small" stickyHeader aria-label={ariaLabel} sx={tableSx}>
        {children}
      </Table>
    </TableContainer>
  );
}
