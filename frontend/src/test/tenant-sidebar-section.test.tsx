import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { TenantSidebarSection } from '../pages/dashboard/tenant/sections/TenantSidebarSection';

// 기존 -> 업무 캘린더 바로가기 카드 + 결재 알림 + 공지사항 순서/클릭 검증
// 변경 -> 캘린더는 대시보드 메인 영역 토글로 이동, 사이드바는 공지사항만 표시
describe('TenantSidebarSection', () => {
    it('renders only the notice card', () => {
        render(
            <AppProviders>
                <TenantSidebarSection />
            </AppProviders>,
        );

        const headings = screen.getAllByRole('heading', { level: 6 });
        const headingTexts = headings.map((heading) => heading.textContent);

        expect(headingTexts).toEqual(['공지사항']);
    });
});
