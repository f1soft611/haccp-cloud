import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridPaginationBar } from '../shared/components/data/GridPaginationBar';

describe('GridPaginationBar', () => {
  it('renders total count and fires handlers', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <GridPaginationBar
        pageIndex={1}
        pageSize={10}
        totalCount={42}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(screen.getByText('총 42건')).toBeInTheDocument();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: '페이지 크기 선택' }),
    );
    fireEvent.click(screen.getByRole('option', { name: '20개' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
