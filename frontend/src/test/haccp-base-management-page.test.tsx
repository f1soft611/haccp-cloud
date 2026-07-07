import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { HaccpBaseManagementPage } from '../pages/documents/haccp-base/HaccpBaseManagementPage';

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

describe('HaccpBaseManagementPage', () => {
  it('renders columns and opens create modal', () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('구분명')).toBeInTheDocument();
    expect(screen.getByText('분류')).toBeInTheDocument();
    expect(screen.getByText('등록주기')).toBeInTheDocument();
    expect(screen.getByText('등록자')).toBeInTheDocument();
    expect(screen.getByText('등록일')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '분류 설정' }));
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/categories');

    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    expect(
      screen.getByRole('dialog', { name: /업무 추가/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /구분코드/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /구분명/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '분류' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: '등록주기' }),
    ).toBeInTheDocument();
  });

  it('navigates to sub pages from action columns', () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '담당자 설정' })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/assignees/1');

    fireEvent.click(
      screen.getAllByRole('button', { name: '문서생성/편집' })[0],
    );
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/editor/1');
  });
});
