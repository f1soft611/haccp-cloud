import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';

describe('GridPaginationBar', () => {
  // 총 건수 표시, 페이지 크기 변경 핸들러 호출을 확인한다
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
    fireEvent.click(screen.getByRole('option', { name: '20개씩' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  // 총 건수, 페이지 번호, 페이지 크기 셀렉트가 왼쪽부터 순서대로 놓이는지 확인한다
  it('places total, pagination, size select in order', () => {
    const { container } = render(
      <GridPaginationBar
        pageIndex={1}
        pageSize={10}
        totalCount={42}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const children = Array.from(container.firstElementChild?.children ?? []);
    expect(children).toHaveLength(3);
    expect(children[0]).toHaveTextContent('총 42건');
    expect(children[1].querySelector('nav')).not.toBeNull();
    expect(
      children[2].querySelector('[aria-label="페이지 크기 선택"]'),
    ).not.toBeNull();
  });
});