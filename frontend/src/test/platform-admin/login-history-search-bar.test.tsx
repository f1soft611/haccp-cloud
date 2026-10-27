import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoginHistorySearchBar } from '../../pages/platform-admin/login-history/components/LoginHistorySearchBar';

describe('LoginHistorySearchBar', () => {
    it('로그인 결과가 빈 값이면 콤보박스에 전체를 표시한다', () => {
        render(
            <LoginHistorySearchBar
                value={{
                    searchField: 'userId',
                    searchKeyword: '',
                    filterLoginResult: '',
                    filterFactoryCode: '',
                    filterStartDt: '',
                    filterEndDt: '',
                }}
                onChange={() => {}}
                onSearch={() => {}}
            />,
        );
        expect(screen.getByRole('combobox', { name: /로그인 결과/ })).toHaveTextContent('전체');
    });
});
