import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '../shared/components/layout/PageHeader';
import {
  CurrentMenuGroupLabelProvider,
  UserMenuMetadataProvider,
} from '../shared/components/layout/userMenuMetadataContext';

describe('PageHeader', () => {
  it('renders group breadcrumb, title, and description', () => {
    render(
      <MemoryRouter>
        <PageHeader
          groupLabel="시스템 관리"
          title="메뉴 관리"
          description="시스템 메뉴를 등록하고 정렬 순서를 관리합니다."
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('시스템 관리')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '메뉴 관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('시스템 메뉴를 등록하고 정렬 순서를 관리합니다.'),
    ).toBeInTheDocument();
  });

  it('can ignore menu metadata and hide group label', () => {
    render(
      <MemoryRouter initialEntries={['/account/my-page']}>
        <UserMenuMetadataProvider
          value={{
            '/account/my-page': {
              menuNm: '조직 관리',
              menuDc: '조직 정보를 관리합니다.',
            },
          }}
        >
          <CurrentMenuGroupLabelProvider value="조직 관리">
            <PageHeader
              title="내 정보 관리"
              description="프로필 이미지와 결재 이미지를 관리합니다."
              useMenuMetadata={false}
              showGroupLabel={false}
            />
          </CurrentMenuGroupLabelProvider>
        </UserMenuMetadataProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: '내 정보 관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('프로필 이미지와 결재 이미지를 관리합니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('조직 관리')).not.toBeInTheDocument();
  });
});
