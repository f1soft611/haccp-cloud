import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UsersSearchBar } from '../../../../pages/organization/users/components/UsersSearchBar.tsx';

describe('UsersSearchBar', () => {
  it('검색어 입력 필드에서 엔터를 누르면 검색이 실행된다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <UsersSearchBar
        value={{ keyword: '', filterActive: '' }}
        onChange={() => {}}
        onSearch={onSearch}
        onCreate={() => {}}
      />,
    );

    await user.type(screen.getByLabelText('이름, 이메일, 부서 검색'), '관리자A{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
