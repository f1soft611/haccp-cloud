import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers/AppProviders.tsx';
import { TenantFilterSection } from '../../pages/dashboard/tenant/sections/TenantFilterSection';
import { EMPTY_TODO_FILTER } from '../../pages/dashboard/tenant/todoFilter';

describe('TenantFilterSection', () => {
    it('shows placeholders and wires search, reset and enter', () => {
        const onSearch = vi.fn();
        const onReset = vi.fn();
        render(
            <AppProviders>
                <TenantFilterSection
                    value={EMPTY_TODO_FILTER}
                    categoryOptions={['위생관리']}
                    viewMode="list"
                    onChange={vi.fn()}
                    onReset={onReset}
                    onSearch={onSearch}
                    onViewModeChange={vi.fn()}
                />
            </AppProviders>,
        );

        // 라벨 대신 빈 값 placeholder
        expect(screen.getByRole('combobox', { name: '업무분류' })).toHaveTextContent('업무분류');
        expect(screen.getByRole('combobox', { name: '주기' })).toHaveTextContent('주기');
        expect(screen.getByRole('combobox', { name: '상태' })).toHaveTextContent('상태');

        const keyword = screen.getByPlaceholderText('업무명을 입력하세요.');
        fireEvent.keyDown(keyword, { key: 'Enter' });
        expect(onSearch).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: '조회' }));
        expect(onSearch).toHaveBeenCalledTimes(2);

        fireEvent.click(screen.getByRole('button', { name: '초기화' }));
        expect(onReset).toHaveBeenCalledTimes(1);
    });
});