import { TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { darkTheme } from '../../../../app/theme';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';

describe('AdminGrid', () => {
  it('다크모드에서도 라이트와 같은 헤더, 본문 색을 쓴다', () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <AdminGrid ariaLabel="테스트 목록">
          <TableHead>
            <TableRow>
              <TableCell>헤더</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>본문</TableCell>
            </TableRow>
          </TableBody>
        </AdminGrid>
      </ThemeProvider>,
    );

    expect(screen.getByText('헤더')).toHaveStyle({
      backgroundColor: '#EEF0F3',
      color: '#000',
    });
    expect(screen.getByText('본문')).toHaveStyle({ color: '#333333' });
  });
});