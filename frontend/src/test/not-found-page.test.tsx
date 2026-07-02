import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from '../pages/NotFoundPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('NotFoundPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders the not found layout copy and footer text', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        name: '요청하신 페이지를 찾을 수 없습니다',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /주소가 변경되었거나 페이지가 삭제되었을 수 있습니다\. HACCP 클라우드 메뉴로 돌아가 다시 이용해 주세요\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '돌아가기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /© 2026 HACCP Cloud · F1soft 이용약관 개인정보처리방침 쿠키정책/,
      ),
    ).toBeInTheDocument();
  });

  it('navigates to previous page when the go back button is clicked', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
