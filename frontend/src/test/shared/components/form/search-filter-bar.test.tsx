import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, TextField } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

describe('SearchFilterBar', () => {
  it('텍스트 칸에서 Enter 를 누르면 검색이 1번 실행된다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <SearchFilterBar onSearch={onSearch}>
        <TextField label="검색어" />
      </SearchFilterBar>,
    );

    await user.type(screen.getByLabelText('검색어'), '값{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('조회 버튼을 누르면 검색이 1번 실행된다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchFilterBar onSearch={onSearch}>조건</SearchFilterBar>);

    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('disabled 면 조회 버튼이 비활성화되고 Enter 로도 검색되지 않는다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <SearchFilterBar onSearch={onSearch} disabled>
        <TextField label="검색어" />
      </SearchFilterBar>,
    );

    expect(screen.getByRole('button', { name: '조회' })).toBeDisabled();
    await user.type(screen.getByLabelText('검색어'), '값{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('actions 의 버튼을 눌러도 검색되지 않는다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onCreate = vi.fn();

    render(
      <SearchFilterBar onSearch={onSearch} actions={<Button onClick={onCreate}>등록</Button>}>
        조건
      </SearchFilterBar>,
    );

    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('onReset 이 있을 때만 초기화 버튼이 보이고, 눌러도 검색되지 않는다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(<SearchFilterBar onSearch={onSearch}>조건</SearchFilterBar>);
    expect(screen.queryByRole('button', { name: '초기화' })).not.toBeInTheDocument();

    rerender(
      <SearchFilterBar onSearch={onSearch} onReset={onReset}>
        조건
      </SearchFilterBar>,
    );
    await user.click(screen.getByRole('button', { name: '초기화' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('detail 은 조건 줄 아래에 표시된다', () => {
    render(
      <SearchFilterBar onSearch={() => {}} detail={<div>상세</div>}>
        <div>조건</div>
      </SearchFilterBar>,
    );

    const position = screen.getByText('조건').compareDocumentPosition(screen.getByText('상세'));

    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});