// ApprovalDraftHeader 가 공통 PageHeader 로 제목을 그리고, 메뉴 메타데이터에 덮이지 않는지 확인한다
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ApprovalDraftHeader } from '../../pages/documents/approvals/components/ApprovalDraftHeader';
import { UserMenuMetadataProvider } from '../../shared/components/layout/userMenuMetadataContext';

describe('ApprovalDraftHeader 공통 헤더', () => {
    it('기안서 작성/결재 제목과 문서 관리 경로를 보여준다', () => {
        render(
            <MemoryRouter initialEntries={['/approvals/draft/1']}>
                <ApprovalDraftHeader onBack={() => undefined} />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: '기안서 작성/결재' })).toBeInTheDocument();
        expect(screen.getByText('문서 관리')).toBeInTheDocument();
    });

    it('/approvals 메뉴 메타데이터가 있어도 제목이 바뀌지 않는다', () => {
        render(
            <MemoryRouter initialEntries={['/approvals/draft/1']}>
                <UserMenuMetadataProvider
                    value={{ '/approvals': { menuNm: '결재함', menuDc: '결재 문서를 확인합니다.' } }}
                >
                    <ApprovalDraftHeader onBack={() => undefined} />
                </UserMenuMetadataProvider>
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: '기안서 작성/결재' })).toBeInTheDocument();
        expect(screen.queryByText('결재함')).toBeNull();
    });

    it('핸들러를 안 넘긴 버튼은 없고 돌아가기는 항상 있다', () => {
        render(
            <MemoryRouter>
                <ApprovalDraftHeader onBack={() => undefined} />
            </MemoryRouter>,
        );

        expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['돌아가기']);
    });
});