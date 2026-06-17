import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '../shared/components/layout/PageHeader';

describe('PageHeader', () => {
  it('renders group breadcrumb, title, and description', () => {
    render(
      <PageHeader
        groupLabel="시스템 관리"
        title="메뉴 관리"
        description="시스템 메뉴를 등록하고 정렬 순서를 관리합니다."
      />,
    );

    expect(screen.getByText('시스템 관리')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '메뉴 관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('시스템 메뉴를 등록하고 정렬 순서를 관리합니다.'),
    ).toBeInTheDocument();
  });
});
